/**
 * The wire protocol between `connectRoom` (browser) and `SyncRoom` (Durable Object). Shared by
 * both sides so a change to either is a type error on the other; every message that arrives is
 * still parsed, because a peer — or anyone who opens the socket — can send anything.
 */

/** A JSON value, the only thing a room stores or relays. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** Client → room. `value: null` deletes the path. */
export type ClientMessage =
  | { t: 'set'; id: string; path: string; value: Json }
  | { t: 'presence'; value: Json }

/** Room → client. */
export type ServerMessage =
  | { t: 'hello'; self: string; state: Record<string, Json>; presence: Record<string, Json> }
  | { t: 'set'; id: string; by: string; path: string; value: Json }
  | { t: 'presence'; conn: string; value: Json }
  /** `id` names the refused write, so the client can stop waiting for it. */
  | { t: 'error'; message: string; id?: string }

export const LIMITS = {
  /** Longest accepted path, e.g. `notes/2f1c…`. */
  maxPathLength: 256,
  /** Largest accepted JSON value, in UTF-16 code units of its serialization. */
  maxValueLength: 64 * 1024,
} as const

/**
 * A path is `/`-separated segments of letters, digits, `_`, `-`, `.` and `:` — no empty
 * segment, and no `.` or `..` segment, so `notes/42` has exactly one spelling.
 */
export function isValidPath(path: string): boolean {
  if (path.length === 0 || path.length > LIMITS.maxPathLength) return false
  return path
    .split('/')
    .every((segment) => /^[\w.:-]+$/.test(segment) && segment !== '.' && segment !== '..')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// The `as Json` narrowings below are sound, not trust: anything JSON.parse returns is by
// construction a JSON value. What they do not establish is the value's *shape*; that is the
// job of the parser each `room.signal`/`room.map` takes.

/** Parses a client message, or returns an error string for the room to send back. */
export function parseClientMessage(raw: string): ClientMessage | string {
  if (raw.length > LIMITS.maxValueLength + 1024) return 'Message too large'
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return 'Message is not JSON'
  }
  if (!isRecord(data)) return 'Message must be an object'
  if (data['t'] === 'presence') {
    return { t: 'presence', value: (data['value'] ?? null) as Json }
  }
  if (data['t'] === 'set') {
    const { id, path } = data
    if (typeof id !== 'string' || id.length === 0 || id.length > 64)
      return 'set.id must be a short string'
    if (typeof path !== 'string' || !isValidPath(path)) {
      return 'set.path must be /-separated segments of letters, digits, _ - . : (no . or ..)'
    }
    return { t: 'set', id, path, value: (data['value'] ?? null) as Json }
  }
  return 'Unknown message type'
}

/** Parses a room message on the client. Returns `null` for anything unrecognized. */
export function parseServerMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== 'string') return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data)) return null
  switch (data['t']) {
    case 'hello': {
      const { self, state, presence } = data
      if (typeof self !== 'string' || !isRecord(state) || !isRecord(presence)) return null
      return {
        t: 'hello',
        self,
        state: state as Record<string, Json>,
        presence: presence as Record<string, Json>,
      }
    }
    case 'set': {
      const { id, by, path } = data
      if (typeof id !== 'string' || typeof by !== 'string' || typeof path !== 'string') return null
      return { t: 'set', id, by, path, value: (data['value'] ?? null) as Json }
    }
    case 'presence': {
      const { conn } = data
      if (typeof conn !== 'string') return null
      return { t: 'presence', conn, value: (data['value'] ?? null) as Json }
    }
    case 'error': {
      const { message, id } = data
      if (typeof message !== 'string') return null
      return typeof id === 'string' ? { t: 'error', message, id } : { t: 'error', message }
    }
    default:
      return null
  }
}
