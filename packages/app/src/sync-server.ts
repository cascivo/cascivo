import { LIMITS, parseClientMessage } from './sync-protocol'
import type { Json, ServerMessage } from './sync-protocol'

/**
 * `@cascivo/app/sync-server` — the Durable Object half of `@cascivo/app/sync`.
 *
 * ```ts
 * // worker/index.ts
 * import { roomResponse } from '@cascivo/app/sync-server'
 * export { SyncRoom } from '@cascivo/app/sync-server'
 *
 * export default {
 *   fetch(request: Request, env: Env) {
 *     const room = /^\/api\/rooms\/([\w-]+)$/.exec(new URL(request.url).pathname)
 *     if (room) return roomResponse(request, env.ROOMS, room[1]!)
 *     …
 *   },
 * }
 * ```
 * ```jsonc
 * // wrangler.jsonc
 * "durable_objects": { "bindings": [{ "name": "ROOMS", "class_name": "SyncRoom" }] },
 * "migrations": [{ "tag": "v1", "new_sqlite_classes": ["SyncRoom"] }]
 * ```
 *
 * One object per room name. It uses the WebSocket Hibernation API, so an idle room costs
 * nothing, and keeps each connection's id and presence in the socket attachment, so they
 * survive hibernation. Values persist in Durable Object storage; presence does not.
 *
 * Presence lists every connection: `{}` from the moment it joins until it sets a value, and
 * `null` (to the others) once its socket closes.
 */

// The slices of the Workers runtime this uses, declared structurally so the published types
// do not require @cloudflare/workers-types.

/** A server-side WebSocket accepted through the Hibernation API. */
export interface HibernatableWebSocket {
  send(message: string): void
  close(code?: number, reason?: string): void
  serializeAttachment(value: unknown): void
  deserializeAttachment(): unknown
}

export interface SyncRoomState {
  /** The object's id; `name` is the room name when it was created with `idFromName`. */
  readonly id?: { readonly name?: string | undefined }
  acceptWebSocket(socket: HibernatableWebSocket): void
  getWebSockets(): HibernatableWebSocket[]
  storage: {
    get<T = unknown>(key: string): Promise<T | undefined>
    put(key: string, value: unknown): Promise<void>
    delete(key: string): Promise<boolean>
    list<T = unknown>(options: { prefix: string }): Promise<Map<string, T>>
  }
}

interface Attachment {
  conn: string
  presence: Json
}

const VALUE_PREFIX = 'v:'

/** One stored write, as `SyncRoom.onWrite` receives it. */
export interface RoomWrite {
  /** The room's name, when the object was created with `idFromName` (as `roomResponse` does). */
  room: string | null
  path: string
  /** The new value; `null` when the path was deleted. */
  value: Json
}

function attachmentOf(socket: HibernatableWebSocket): Attachment | null {
  const raw: unknown = socket.deserializeAttachment()
  if (typeof raw === 'object' && raw !== null && typeof (raw as Attachment).conn === 'string') {
    return raw as Attachment
  }
  return null
}

/**
 * A multiplayer room: last-writer-wins per path, in the order this object receives writes.
 * Every write is echoed to every socket — the writer included — which is what lets each
 * client settle on the room's order rather than its own.
 */
export class SyncRoom {
  constructor(
    private readonly ctx: SyncRoomState,
    _env?: unknown,
  ) {}

  /**
   * Called after each write is stored and sent to the room. Override it to mirror writes
   * elsewhere — into D1, say, so data can be queried across rooms. `value` is `null` for a
   * delete. A throw is logged and never reaches the clients: the write has already happened.
   *
   * ```ts
   * export class NotesRoom extends SyncRoom {
   *   constructor(ctx: DurableObjectState, private env: Env) { super(ctx) }
   *   override async onWrite({ room, path, value }: RoomWrite) {
   *     await this.env.DB.prepare('INSERT OR REPLACE INTO notes VALUES (?, ?, ?)')
   *       .bind(room, path, JSON.stringify(value)).run()
   *   }
   * }
   * ```
   */
  protected onWrite(_write: RoomWrite): void | Promise<void> {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 })
    }
    const pair = new (
      globalThis as unknown as { WebSocketPair: new () => [WebSocket, HibernatableWebSocket] }
    ).WebSocketPair()
    const [client, server] = pair
    await this.accept(server)
    return new Response(null, { status: 101, webSocket: client } as ResponseInit)
  }

  /** Registers a socket and sends it the room's current state. Public for tests. */
  async accept(socket: HibernatableWebSocket): Promise<void> {
    this.ctx.acceptWebSocket(socket)
    const conn = crypto.randomUUID()
    // Present from the moment it joins, with an empty value until it sets one.
    socket.serializeAttachment({ conn, presence: {} } satisfies Attachment)

    const stored = await this.ctx.storage.list<Json>({ prefix: VALUE_PREFIX })
    const state: Record<string, Json> = {}
    for (const [key, value] of stored) state[key.slice(VALUE_PREFIX.length)] = value

    const presence: Record<string, Json> = {}
    for (const other of this.ctx.getWebSockets()) {
      const attachment = attachmentOf(other)
      if (attachment && attachment.conn !== conn) presence[attachment.conn] = attachment.presence
    }
    send(socket, { t: 'hello', self: conn, state, presence })
    this.broadcast({ t: 'presence', conn, value: {} }, socket)
  }

  async webSocketMessage(socket: HibernatableWebSocket, raw: string | ArrayBuffer): Promise<void> {
    const attachment = attachmentOf(socket)
    if (!attachment) return
    const message =
      typeof raw === 'string' ? parseClientMessage(raw) : 'Binary messages are not supported'
    if (typeof message === 'string') {
      send(socket, { t: 'error', message })
      return
    }

    if (JSON.stringify(message.value).length > LIMITS.maxValueLength) {
      send(socket, { t: 'error', message: 'Value is too large' })
      return
    }

    if (message.t === 'presence') {
      // `null` clears this connection's value; only closing the socket leaves the room.
      const value = message.value ?? {}
      socket.serializeAttachment({ ...attachment, presence: value } satisfies Attachment)
      this.broadcast({ t: 'presence', conn: attachment.conn, value }, socket)
      return
    }

    const key = VALUE_PREFIX + message.path
    if (message.value === null) await this.ctx.storage.delete(key)
    else await this.ctx.storage.put(key, message.value)
    this.broadcast({
      t: 'set',
      id: message.id,
      by: attachment.conn,
      path: message.path,
      value: message.value,
    })
    try {
      await this.onWrite({
        room: this.ctx.id?.name ?? null,
        path: message.path,
        value: message.value,
      })
    } catch (error) {
      console.error(`[cascivo/sync] onWrite failed for "${message.path}":`, error)
    }
  }

  async webSocketClose(socket: HibernatableWebSocket): Promise<void> {
    const attachment = attachmentOf(socket)
    if (attachment) this.broadcast({ t: 'presence', conn: attachment.conn, value: null }, socket)
  }

  async webSocketError(socket: HibernatableWebSocket): Promise<void> {
    await this.webSocketClose(socket)
  }

  private broadcast(message: ServerMessage, except?: HibernatableWebSocket): void {
    const data = JSON.stringify(message)
    for (const socket of this.ctx.getWebSockets()) {
      if (socket === except) continue
      try {
        socket.send(data)
      } catch {
        // A socket closing mid-broadcast is routine; its close handler cleans up.
      }
    }
  }
}

function send(socket: HibernatableWebSocket, message: ServerMessage): void {
  socket.send(JSON.stringify(message))
}

/** The slice of a Durable Object namespace binding `roomResponse` uses. */
export interface RoomNamespace<Id> {
  idFromName(name: string): Id
  get(id: Id): { fetch(request: Request): Promise<Response> }
}

const ROOM_NAME = /^[\w-]{1,64}$/

/** Forwards a WebSocket upgrade to the room named `name` (one Durable Object per name). */
export function roomResponse<Id>(
  request: Request,
  namespace: RoomNamespace<Id>,
  name: string,
): Promise<Response> | Response {
  if (!ROOM_NAME.test(name)) {
    return Response.json({ error: 'Room names are 1–64 letters, digits, _ or -' }, { status: 400 })
  }
  if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
    return Response.json({ error: 'Expected a WebSocket upgrade' }, { status: 426 })
  }
  return namespace.get(namespace.idFromName(name)).fetch(request)
}
