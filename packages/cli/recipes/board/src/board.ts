import { connectRoom } from '@cascivo/app/sync'

export interface Note {
  text: string
  x: number
  y: number
}

export interface Cursor {
  x: number
  y: number
}

/** `/board?room=team` is its own board; the room name is what the Worker routes on. */
export const roomName =
  (new URLSearchParams(location.search).get('room') ?? '').replace(/[^\w-]/g, '').slice(0, 64) ||
  'lobby'

// One WebSocket to the room's Durable Object. It connects when this module first loads (the
// /board route is its own chunk) and reconnects on its own.
export const room = connectRoom(`/api/rooms/${roomName}`)

/**
 * Values in a room come from other people, so they are parsed, not cast. A note that fails
 * this is ignored rather than breaking the board.
 */
export function parseNote(raw: unknown): Note {
  if (typeof raw === 'object' && raw !== null) {
    const { text, x, y } = raw as Record<string, unknown>
    if (typeof text === 'string' && typeof x === 'number' && typeof y === 'number') {
      return { text, x, y }
    }
  }
  throw new Error('Malformed note')
}

export function parseCursor(raw: unknown): Cursor | null {
  if (typeof raw === 'object' && raw !== null) {
    const { x, y } = raw as Record<string, unknown>
    if (typeof x === 'number' && typeof y === 'number') return { x, y }
  }
  return null
}

/** Notes by id. Each note is its own path, so two people editing two notes never collide. */
export const notes = room.map('notes', parseNote)

export function addNote(): void {
  const offset = Object.keys(notes.value).length * 24
  notes.set(crypto.randomUUID(), { text: '', x: 24 + (offset % 240), y: 24 + (offset % 160) })
}
