import { isValidPath, LIMITS, parseClientMessage } from './sync-protocol'
import type { Json, ServerMessage } from './sync-protocol'

export type { Json } from './sync-protocol'

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
  /** Set by `roomResponse(…, { readOnly: true })`: this socket may watch but not write. */
  readOnly?: boolean
  /** Set by `roomResponse(…, { claims })`: what the Worker verified about this connection. */
  claims?: Json
}

const VALUE_PREFIX = 'v:'
/** Set on the request `roomResponse` forwards, never taken from the browser's. */
const READ_ONLY_HEADER = 'x-cascivo-room-read-only'
/** Carries `roomResponse`'s `claims`, as JSON; set there and only there. */
const CLAIMS_HEADER = 'x-cascivo-room-claims'
/** Claims are an identity, not data: a role, a user id. */
const MAX_CLAIMS_LENGTH = 4096
/** Marks the request `writeRoom` sends; the only non-WebSocket request a room accepts. */
const SERVER_WRITE_HEADER = 'x-cascivo-room-write'
/** Every header a room trusts starts with this; `roomResponse` strips them all from a caller. */
const ROOM_HEADER_PREFIX = 'x-cascivo-room-'

/** One stored write, as `SyncRoom.onWrite` receives it. */
export interface RoomWrite {
  /** The room's name, when the object was created with `idFromName` (as `roomResponse` does). */
  room: string | null
  path: string
  /** The new value; `null` when the path was deleted. */
  value: Json
}

/** A browser's write, as `SyncRoom.canWrite` receives it. */
export interface ClientWrite {
  /** The room's name, when the object was created with `idFromName` (as `roomResponse` does). */
  room: string | null
  path: string
  /** The value to store; `null` deletes the path. */
  value: Json
  /** Who is writing. */
  connection: {
    /** The connection's id in the room, as other clients see it in `room.presence`. */
    id: string
    /**
     * What the Worker verified about this connection and passed as `roomResponse(…, { claims })`
     * — a role, a user id. `null` when it passed none. Never taken from the browser.
     */
    claims: Json
  }
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
    protected readonly ctx: SyncRoomState,
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

  /**
   * Decides whether a browser's write is stored. Return `true` to accept it, or `false` or a
   * message to refuse it: the writer gets the message as the write's error and drops the
   * write, and nobody else sees it. Every write is accepted by default. Writes from the Worker
   * (`writeRoom`, or `write` in a subclass) do not pass through here.
   *
   * `connection.claims` is what the Worker verified before opening the socket, so a rule can
   * depend on who is writing, not only on what:
   *
   * ```ts
   * // worker: roomResponse(request, env.ROOMS, name, { claims: { role: isHost ? 'host' : 'guest' } })
   * export class BoardRoom extends SyncRoom {
   *   protected override canWrite({ path, connection }: ClientWrite) {
   *     if (path.startsWith('notes/')) return true // anyone may add and move notes
   *     const { claims } = connection
   *     const host = typeof claims === 'object' && claims !== null && 'role' in claims
   *       && claims.role === 'host'
   *     return host || 'Only the host can change the board settings'
   *   }
   * }
   * ```
   *
   * Use `this.read(path)` to judge a write against the value it replaces. A throw refuses the
   * write and is logged; its message is not sent.
   */
  protected canWrite(_write: ClientWrite): boolean | string | Promise<boolean | string> {
    return true
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST' && request.headers.get(SERVER_WRITE_HEADER) === '1') {
      return this.serverWrite(request)
    }
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 })
    }
    const pair = new (
      globalThis as unknown as { WebSocketPair: new () => [WebSocket, HibernatableWebSocket] }
    ).WebSocketPair()
    const [client, server] = pair
    const claims = parseClaims(request.headers.get(CLAIMS_HEADER))
    await this.accept(server, {
      readOnly: request.headers.get(READ_ONLY_HEADER) === '1',
      ...(claims === undefined ? {} : { claims }),
    })
    return new Response(null, { status: 101, webSocket: client } as ResponseInit)
  }

  /** Registers a socket and sends it the room's current state. Public for tests. */
  async accept(
    socket: HibernatableWebSocket,
    options: { readOnly?: boolean; claims?: Json } = {},
  ): Promise<void> {
    this.ctx.acceptWebSocket(socket)
    const conn = crypto.randomUUID()
    // Present from the moment it joins, with an empty value until it sets one.
    socket.serializeAttachment({
      conn,
      presence: {},
      ...(options.readOnly ? { readOnly: true } : {}),
      ...(options.claims !== undefined && options.claims !== null
        ? { claims: options.claims }
        : {}),
    } satisfies Attachment)

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

    const refusal = message.t === 'set' ? { id: message.id } : {}
    if (JSON.stringify(message.value).length > LIMITS.maxValueLength) {
      send(socket, { t: 'error', message: 'Value is too large', ...refusal })
      return
    }

    if (message.t === 'presence') {
      // `null` clears this connection's value; only closing the socket leaves the room.
      const value = message.value ?? {}
      socket.serializeAttachment({ ...attachment, presence: value } satisfies Attachment)
      this.broadcast({ t: 'presence', conn: attachment.conn, value }, socket)
      return
    }

    if (attachment.readOnly) {
      send(socket, { t: 'error', message: 'This room is read-only', ...refusal })
      return
    }
    let verdict: boolean | string
    try {
      verdict = await this.canWrite({
        room: this.ctx.id?.name ?? null,
        path: message.path,
        value: message.value,
        connection: { id: attachment.conn, claims: attachment.claims ?? null },
      })
    } catch (error) {
      console.error(`[cascivo/sync] canWrite failed for "${message.path}":`, error)
      verdict = false
    }
    if (verdict !== true) {
      const reason = typeof verdict === 'string' && verdict ? verdict : 'Write refused'
      send(socket, { t: 'error', message: reason, ...refusal })
      return
    }
    await this.store(message.path, message.value, message.id, attachment.conn)
  }

  /** Stores a write, echoes it to every socket, then runs `onWrite`. */
  private async store(path: string, value: Json, id: string, by: string): Promise<void> {
    const key = VALUE_PREFIX + path
    if (value === null) await this.ctx.storage.delete(key)
    else await this.ctx.storage.put(key, value)
    this.broadcast({ t: 'set', id, by, path, value })
    try {
      await this.onWrite({ room: this.ctx.id?.name ?? null, path, value })
    } catch (error) {
      console.error(`[cascivo/sync] onWrite failed for "${path}":`, error)
    }
  }

  private serverWrites = 0

  /** A stored value, for subclasses; `undefined` when the path is empty. */
  protected read(path: string): Promise<Json | undefined> {
    return this.ctx.storage.get<Json>(VALUE_PREFIX + path)
  }

  /** Every stored path under `prefix`, for subclasses. */
  protected async paths(prefix: string): Promise<string[]> {
    const stored = await this.ctx.storage.list({ prefix: VALUE_PREFIX + prefix })
    return [...stored.keys()].map((key) => key.slice(VALUE_PREFIX.length))
  }

  /** A write from a subclass: stored and sent to every socket like a client's. `null` deletes. */
  protected write(path: string, value: Json): Promise<void> {
    return this.store(path, value, `server-${++this.serverWrites}`, 'server')
  }

  /** A write from the Worker itself (`writeRoom`), checked like any client write. */
  private async serverWrite(request: Request): Promise<Response> {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Expected JSON' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Expected { path, value }' }, { status: 400 })
    }
    const { path, value } = body as Record<string, unknown>
    if (typeof path !== 'string' || !isValidPath(path) || value === undefined) {
      return Response.json({ error: 'Expected { path, value } with a valid path' }, { status: 400 })
    }
    if (JSON.stringify(value).length > LIMITS.maxValueLength) {
      return Response.json({ error: 'Value is too large' }, { status: 413 })
    }
    // Parsed from JSON, so a JSON value by construction.
    await this.write(path, value as Json)
    return new Response(null, { status: 204 })
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

/** The claims header `roomResponse` set: JSON, or nothing. Anything else is ignored. */
function parseClaims(raw: string | null): Json | undefined {
  if (raw === null || raw.length > MAX_CLAIMS_LENGTH) return undefined
  try {
    // JSON.parse only produces JSON values.
    return JSON.parse(raw) as Json
  } catch {
    return undefined
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
  options: {
    /**
     * The browser may watch the room but not write to it — for rooms only the server writes,
     * like a job's progress (`writeRoom`, `@cascivo/app/jobs-server`).
     */
    readOnly?: boolean
    /**
     * What the Worker verified about this connection — a role, a user id — for the room's
     * `canWrite` to read as `connection.claims`. Only the Worker sets it; a browser cannot.
     * JSON, at most 4 KB serialized.
     */
    claims?: Json
  } = {},
): Promise<Response> | Response {
  if (!ROOM_NAME.test(name)) {
    return Response.json({ error: 'Room names are 1–64 letters, digits, _ or -' }, { status: 400 })
  }
  if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
    return Response.json({ error: 'Expected a WebSocket upgrade' }, { status: 426 })
  }
  // The room's own headers are set here and only here: a browser cannot send them through.
  const headers = new Headers(request.headers)
  // Collected first: deleting while iterating a Headers object skips the entry after each delete.
  const forged = Array.from(headers.keys()).filter((name) => name.startsWith(ROOM_HEADER_PREFIX))
  for (const name of forged) headers.delete(name)
  if (options.readOnly) headers.set(READ_ONLY_HEADER, '1')
  if (options.claims !== undefined) {
    const claims = JSON.stringify(options.claims)
    if (claims.length > MAX_CLAIMS_LENGTH) {
      throw new Error(`roomResponse: claims are ${claims.length} characters; the limit is 4096`)
    }
    headers.set(CLAIMS_HEADER, claims)
  }
  return namespace.get(namespace.idFromName(name)).fetch(new Request(request, { headers }))
}

/**
 * Writes one value into a room from the Worker — a Workflow step, a Queue consumer, a cron —
 * and every browser in the room sees it, as if a client had written it. `null` deletes.
 */
export async function writeRoom<Id>(
  namespace: RoomNamespace<Id>,
  name: string,
  path: string,
  value: Json,
): Promise<void> {
  if (!ROOM_NAME.test(name)) throw new Error(`Invalid room name "${name}"`)
  if (!isValidPath(path)) throw new Error(`Invalid room path "${path}"`)
  const response = await namespace.get(namespace.idFromName(name)).fetch(
    new Request('https://room.internal/write', {
      method: 'POST',
      headers: { [SERVER_WRITE_HEADER]: '1', 'content-type': 'application/json' },
      body: JSON.stringify({ path, value }),
    }),
  )
  if (!response.ok) {
    throw new Error(
      `Writing "${path}" to room "${name}" failed: ${response.status} ${await response.text()}`,
    )
  }
}
