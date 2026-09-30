import { computed, signal } from '@cascivo/core'
import type { ReadonlySignal, StorageDriver } from '@cascivo/core'
import { isValidPath, LIMITS, parseServerMessage } from './sync-protocol'
import type { ClientMessage, Json } from './sync-protocol'

/**
 * `@cascivo/app/sync` — signals shared by everyone in a room, over one WebSocket to a
 * `SyncRoom` Durable Object (`@cascivo/app/sync-server`).
 *
 * ```ts
 * const room = connectRoom('/api/rooms/demo')
 * const title = room.signal('title', 'Untitled', parseString)
 * const notes = room.map('notes', parseNote)
 *
 * title.value                   // every client sees the same value
 * title.set('Roadmap')          // applied locally at once, then confirmed by the room
 * notes.set(id, { text: 'hi' }) // one entry; concurrent edits to other entries never collide
 * ```
 *
 * Each path is last-writer-wins **in the order the room receives writes**. A local write shows
 * immediately as pending; the room echoes every write to every client, including the writer,
 * and each client applies the echo as authoritative. So two people writing the same path at
 * once briefly see their own value, then both settle on the same one.
 *
 * Values from the room come from other people, so each `signal`/`map` takes a parser — a value
 * that fails it is ignored (and logged), never cast into your type.
 */

/** Turns an untrusted value into a `T` or throws. */
export type Parser<T> = (raw: unknown) => T

export type RoomStatus = 'connecting' | 'open' | 'closed'

export interface SharedSignal<T> {
  readonly value: T
  /** The underlying signal, for `computed` and effects. */
  readonly signal: ReadonlySignal<T>
  set(value: T): void
}

export interface SharedMap<T> {
  /** Every entry that currently parses, keyed by id. */
  readonly value: Readonly<Record<string, T>>
  readonly signal: ReadonlySignal<Readonly<Record<string, T>>>
  set(id: string, value: T): void
  delete(id: string): void
}

export interface Room {
  readonly status: ReadonlySignal<RoomStatus>
  /** This connection's id in the room, once connected. */
  readonly self: ReadonlySignal<string | null>
  /**
   * How many of this client's writes the room has not confirmed yet. Non-zero while offline;
   * with `storage`, they survive a reload and go out on the next connection.
   */
  readonly unsynced: ReadonlySignal<number>
  /**
   * Everyone else in the room, keyed by connection id: `{}` until they set a value (cursor,
   * name, selection…). Its size is how many others are here.
   */
  readonly presence: ReadonlySignal<Readonly<Record<string, unknown>>>
  /**
   * Replaces this connection's presence; `null` resets it to `{}`. Not persisted — it goes
   * away when the socket closes.
   */
  setPresence(value: Json): void
  /** `T` must be JSON-serializable: it travels as JSON and is stored as JSON. */
  signal<T>(path: string, initial: T, parse: Parser<T>): SharedSignal<T>
  map<T>(prefix: string, parse: Parser<T>): SharedMap<T>
  /** Closes the socket and stops reconnecting. */
  close(): void
}

export interface RoomOptions {
  /** A WebSocket constructor. Default: the global one. */
  WebSocket?: new (url: string) => WebSocket
  /** Reconnect delay bounds in ms. Default 500 → 10 000, doubling. */
  minReconnectMs?: number
  maxReconnectMs?: number
  /**
   * Keeps the room on this device: the last state seen and every unconfirmed write, saved
   * after each change. On the next start the room renders from it at once, before the socket
   * opens, and the saved writes go out when it does. `indexedDBDriver()` from
   * `@cascivo/storage` suits most apps; any `StorageDriver` works.
   */
  storage?: StorageDriver
  /** The storage key. Default: `cascivo-room:<url>`. */
  storageKey?: string
}

/** What a room keeps on the device. Version it: a stored snapshot outlives the code. */
interface Snapshot {
  v: 1
  confirmed: Record<string, Json>
  pending: { path: string; value: Json }[]
}

/**
 * Reads a stored snapshot. Storage is written by this code, but also by an older version of
 * it, a browser extension or a hand in devtools — so it is parsed like any other payload,
 * and anything off-shape is dropped rather than trusted.
 */
export function parseSnapshot(raw: string): Snapshot | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { v, confirmed, pending } = data as Record<string, unknown>
  if (v !== 1 || typeof confirmed !== 'object' || confirmed === null || !Array.isArray(pending)) {
    return null
  }
  const out: Snapshot = { v: 1, confirmed: {}, pending: [] }
  // JSON.parse only produces JSON values, so each value below is a Json by construction.
  for (const [path, value] of Object.entries(confirmed)) {
    if (isValidPath(path)) out.confirmed[path] = value as Json
  }
  for (const op of pending) {
    if (typeof op !== 'object' || op === null) continue
    const { path, value } = op as Record<string, unknown>
    if (typeof path === 'string' && isValidPath(path) && value !== undefined) {
      out.pending.push({ path, value: value as Json })
    }
  }
  return out
}

function wsUrl(url: string): string {
  if (/^wss?:/.test(url) || typeof location === 'undefined') return url
  const absolute = new URL(url, location.href)
  absolute.protocol = absolute.protocol === 'https:' ? 'wss:' : 'ws:'
  return absolute.href
}

/** Connects to a room. Safe to call during SSR: it stays `connecting` until it has a window. */
export function connectRoom(url: string, options: RoomOptions = {}): Room {
  const Socket = options.WebSocket ?? (typeof WebSocket === 'undefined' ? undefined : WebSocket)
  const minDelay = options.minReconnectMs ?? 500
  const maxDelay = options.maxReconnectMs ?? 10_000

  const storage = options.storage
  const storageKey = options.storageKey ?? `cascivo-room:${url}`
  // Op ids must not repeat across reloads: saved writes are resent under fresh ids.
  const session = Math.random().toString(36).slice(2, 10)

  const status = signal<RoomStatus>('connecting')
  const self = signal<string | null>(null)
  const presence = signal<Record<string, unknown>>({})
  /** Bumped on every change to `confirmed` or `pending`; every shared signal derives from it. */
  const revision = signal(0)

  const confirmed = new Map<string, Json>()
  /** Local writes the room has not echoed yet, in send order. */
  const pending = new Map<string, { path: string; value: Json }>()
  let myPresence: Json = null
  let socket: WebSocket | null = null
  let closed = false
  let delay = minDelay
  let counter = 0

  function view(path: string): Json | undefined {
    let value: Json | undefined = confirmed.get(path)
    for (const op of pending.values()) if (op.path === path) value = op.value
    return value === null ? undefined : value
  }

  function paths(): Set<string> {
    const all = new Set(confirmed.keys())
    for (const op of pending.values()) all.add(op.path)
    return all
  }

  function transmit(message: ClientMessage): void {
    if (socket && socket.readyState === 1) socket.send(JSON.stringify(message))
  }

  const unsynced = signal(0)
  let saveQueued = false

  /** Records a change: re-derives every shared signal, and saves the room once per tick. */
  function changed(): void {
    revision.value++
    unsynced.value = pending.size
    if (!storage || saveQueued) return
    saveQueued = true
    queueMicrotask(() => {
      saveQueued = false
      const snapshot: Snapshot = {
        v: 1,
        confirmed: Object.fromEntries(confirmed),
        pending: [...pending.values()],
      }
      try {
        storage.set(storageKey, JSON.stringify(snapshot))
      } catch (error) {
        console.warn(`[cascivo/sync] could not save ${url} to storage:`, error)
      }
    })
  }

  function queue(path: string, value: Json): string {
    const id = `${session}-${++counter}`
    pending.set(id, { path, value })
    return id
  }

  function write(path: string, value: Json): void {
    if (!isValidPath(path)) throw new Error(`Invalid room path "${path}"`)
    if (JSON.stringify(value).length > LIMITS.maxValueLength) {
      throw new Error(`The value at "${path}" is over ${LIMITS.maxValueLength} characters`)
    }
    const id = queue(path, value)
    changed()
    transmit({ t: 'set', id, path, value })
  }

  function onMessage(raw: unknown): void {
    const message = parseServerMessage(raw)
    if (!message) return
    switch (message.t) {
      case 'hello':
        self.value = message.self
        confirmed.clear()
        for (const [path, value] of Object.entries(message.state)) confirmed.set(path, value)
        presence.value = message.presence
        status.value = 'open'
        delay = minDelay
        // Anything written while disconnected goes out now, in order.
        for (const [id, op] of pending) transmit({ t: 'set', id, path: op.path, value: op.value })
        if (myPresence !== null) transmit({ t: 'presence', value: myPresence })
        changed()
        break
      case 'set':
        if (message.value === null) confirmed.delete(message.path)
        else confirmed.set(message.path, message.value)
        if (message.by === self.value) pending.delete(message.id)
        changed()
        break
      case 'presence': {
        const next = { ...presence.value }
        if (message.value === null) delete next[message.conn]
        else next[message.conn] = message.value
        presence.value = next
        break
      }
      case 'error':
        console.warn(`[cascivo/sync] ${url}: ${message.message}`)
        break
    }
  }

  function open(): void {
    if (closed || !Socket) return
    status.value = 'connecting'
    const ws = new Socket(wsUrl(url))
    socket = ws
    ws.addEventListener('message', (event) => onMessage((event as MessageEvent).data))
    ws.addEventListener('close', () => {
      if (socket !== ws) return
      socket = null
      presence.value = {}
      if (closed) return
      status.value = 'connecting'
      setTimeout(open, delay)
      delay = Math.min(delay * 2, maxDelay)
    })
  }
  /** Seeds the room from storage, then connects — never the other way round, or a stale
   * snapshot could overwrite the room's newer state. */
  function restore(raw: string | null): void {
    const snapshot = raw === null ? null : parseSnapshot(raw)
    if (raw !== null && !snapshot)
      console.warn(`[cascivo/sync] ignoring an unreadable saved copy of ${url}`)
    if (snapshot) {
      for (const [path, value] of Object.entries(snapshot.confirmed)) confirmed.set(path, value)
      for (const op of snapshot.pending) queue(op.path, op.value)
      revision.value++
      unsynced.value = pending.size
    }
    open()
  }

  if (!storage) open()
  else {
    let raw: string | null | Promise<string | null>
    try {
      raw = storage.get(storageKey)
    } catch {
      raw = null
    }
    if (raw instanceof Promise) raw.then(restore, () => restore(null))
    else restore(raw)
  }

  /** The last invalid value warned about, per path — so a bad value logs once, not per change. */
  const warned = new Map<string, Json>()

  function parsed<T>(
    path: string,
    raw: Json | undefined,
    parse: Parser<T>,
  ): { ok: true; value: T } | { ok: false } {
    if (raw === undefined) return { ok: false }
    try {
      return { ok: true, value: parse(raw) }
    } catch (error) {
      if (warned.get(path) !== raw) {
        warned.set(path, raw)
        console.warn(`[cascivo/sync] ignoring an invalid value at "${path}":`, error)
      }
      return { ok: false }
    }
  }

  return {
    status,
    self,
    unsynced,
    presence,
    setPresence(value) {
      myPresence = value
      transmit({ t: 'presence', value })
    },
    signal(path, initial, parse) {
      const current = computed(() => {
        void revision.value
        const result = parsed(path, view(path), parse)
        return result.ok ? result.value : initial
      })
      return {
        get value() {
          return current.value
        },
        signal: current,
        // JSON-serializable by contract (see `Room.signal`); the room re-parses it on arrival.
        set: (value) => write(path, value as Json),
      }
    },
    map(prefix, parse) {
      const base = `${prefix}/`
      const current = computed(() => {
        void revision.value
        const entries: Record<string, ReturnType<typeof parse>> = {}
        for (const path of paths()) {
          if (!path.startsWith(base)) continue
          const result = parsed(path, view(path), parse)
          if (result.ok) entries[path.slice(base.length)] = result.value
        }
        return entries
      })
      return {
        get value() {
          return current.value
        },
        signal: current,
        set: (id, value) => write(base + id, value as Json),
        delete: (id) => write(base + id, null),
      }
    },
    close() {
      closed = true
      status.value = 'closed'
      socket?.close()
      socket = null
    },
  }
}
