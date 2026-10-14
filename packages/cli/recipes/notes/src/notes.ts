import { connectRoom } from '@cascivo/app/sync'
import { indexedDBDriver } from '@cascivo/storage'

export interface Note {
  title: string
  body: string
  /** Epoch ms of the last edit, for ordering. */
  updatedAt: number
}

const LIST_KEY = 'notes-list'

/**
 * Which list this browser shows: `?list=` when the URL names one, otherwise one made up on
 * first visit and remembered. Open the same `?list=` on another device to sync with it.
 */
function resolveList(): string {
  const fromUrl = (new URLSearchParams(location.search).get('list') ?? '')
    .replace(/[^\w-]/g, '')
    .slice(0, 48)
  if (fromUrl) return fromUrl
  try {
    const saved = localStorage.getItem(LIST_KEY)
    if (saved) return saved
    const created = crypto.randomUUID().slice(0, 8)
    localStorage.setItem(LIST_KEY, created)
    return created
  } catch {
    return crypto.randomUUID().slice(0, 8)
  }
}

export const listName = resolveList()

// `storage` makes the list local-first: the room's last state and every unconfirmed edit are
// kept in IndexedDB, so edits made while the connection is down survive a reload or a closed
// tab, and go to the room when it is reachable again.
export const room = connectRoom(`/api/rooms/notes-${listName}`, {
  storage: indexedDBDriver('cascivo-notes'),
})

/** Notes come from other devices, so they are parsed, not cast. */
export function parseNote(raw: unknown): Note {
  if (typeof raw === 'object' && raw !== null) {
    const { title, body, updatedAt } = raw as Record<string, unknown>
    if (typeof title === 'string' && typeof body === 'string' && typeof updatedAt === 'number') {
      return { title, body, updatedAt }
    }
  }
  throw new Error('Malformed note')
}

export const notes = room.map('notes', parseNote)

export function addNote(): void {
  notes.set(crypto.randomUUID(), { title: '', body: '', updatedAt: Date.now() })
}

export function editNote(id: string, note: Note, change: Partial<Note>): void {
  notes.set(id, { ...note, ...change, updatedAt: Date.now() })
}
