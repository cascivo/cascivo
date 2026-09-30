import { batch, computed, effect, signal } from '@cascivo/core'
import type { ReadonlySignal } from '@cascivo/core'
import { createClient } from '@cascivo/app/api'
import { connectRoom } from '@cascivo/app/sync'
import type { Room, RoomStatus } from '@cascivo/app/sync'
import { api, roomPath } from './api'
import {
  byNewest,
  byVotes,
  parseMetaOrNull,
  parsePoll,
  parsePresence,
  parseQuestion,
  parseSpotlight,
} from './model'
import type { Meta, Poll, Question, Reaction, Role, Spotlight } from './model'

export const client = createClient(api)

/** A reaction on its way up the screen. */
export interface Floating {
  id: number
  e: Reaction
  /** Start position across the width, 0–1. */
  x: number
}

export interface Session {
  code: string
  role: Role
  status: ReadonlySignal<RoomStatus>
  /** `null` until the room has answered once; then whether the session exists. */
  found: ReadonlySignal<boolean | null>
  meta: ReadonlySignal<Meta | null>
  questions: ReadonlySignal<Question[]>
  polls: ReadonlySignal<Poll[]>
  spotlight: ReadonlySignal<Spotlight>
  /** The poll the audience should see: the open one, else the one on stage. */
  currentPoll: ReadonlySignal<Poll | null>
  audience: ReadonlySignal<number>
  floating: ReadonlySignal<Floating[]>
  react(e: Reaction): void
  close(): void
}

const FLOAT_MS = 2800
const MAX_FLOATING = 40
let nextFloat = 0

function openSession(code: string, role: Role): Session {
  const room: Room = connectRoom(roomPath(code))
  const meta = room.signal<Meta | null>('meta', null, parseMetaOrNull)
  const questionMap = room.map('q', parseQuestion)
  const pollMap = room.map('p', parsePoll)
  const spotlight = room.signal<Spotlight>('spotlight', null, parseSpotlight)

  const answered = signal(false)
  const stopAnswered = effect(() => {
    if (room.status.value === 'open') answered.value = true
  })

  const floating = signal<Floating[]>([])
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const float = (e: Reaction) => {
    const item: Floating = { id: ++nextFloat, e, x: 0.08 + Math.random() * 0.84 }
    floating.value = [...floating.value.slice(-(MAX_FLOATING - 1)), item]
    const timer = setTimeout(() => {
      timers.delete(timer)
      floating.value = floating.value.filter((f) => f.id !== item.id)
    }, FLOAT_MS)
    timers.add(timer)
  }

  // Others' reactions arrive as presence: `react.n` counts up with each one. A connection's
  // count is recorded the first time it is seen, so joining never replays old reactions.
  const seen = new Map<string, number>()
  const stopReactions = effect(() => {
    const presence = room.presence.value
    for (const [conn, raw] of Object.entries(presence)) {
      let n = 0
      let e: Reaction | null = null
      try {
        const parsed = parsePresence(raw)
        if (parsed.react) ({ n, e } = parsed.react)
      } catch {
        // `{}` before a connection says who it is, or anything off-shape: no reaction.
      }
      const previous = seen.get(conn)
      seen.set(conn, n)
      if (e && previous !== undefined && n > previous) float(e)
    }
    for (const conn of seen.keys()) if (!(conn in presence)) seen.delete(conn)
  })

  let reactions = 0
  room.setPresence({ role })

  const audience = computed(() => {
    let count = role === 'audience' ? 1 : 0
    for (const raw of Object.values(room.presence.value)) {
      try {
        if (parsePresence(raw).role === 'audience') count++
      } catch {
        count++ // just joined, role not sent yet: every joiner is audience until it says otherwise
      }
    }
    return count
  })

  const questions = computed(() => Object.values(questionMap.value))
  const polls = computed(() => Object.values(pollMap.value).sort((a, b) => b.at - a.at))

  return {
    code,
    role,
    status: room.status,
    found: computed(() => (answered.value ? meta.value !== null : null)),
    meta: meta.signal,
    questions,
    polls,
    spotlight: spotlight.signal,
    currentPoll: computed(() => {
      const open = polls.value.find((p) => p.open)
      if (open) return open
      const spot = spotlight.value
      return spot?.kind === 'poll' ? (pollMap.value[spot.id] ?? null) : null
    }),
    audience,
    floating,
    react(e) {
      reactions += 1
      batch(() => {
        room.setPresence({ role, react: { e, n: reactions } })
        float(e)
      })
    },
    close() {
      stopAnswered()
      stopReactions()
      for (const timer of timers) clearTimeout(timer)
      room.close()
    },
  }
}

let current: Session | null = null

/**
 * The session for `code`, connected once and shared by every component on the page. Moving
 * to another session (or role) closes the previous room's socket.
 */
export function getSession(code: string, role: Role): Session {
  if (current && current.code === code && current.role === role) return current
  current?.close()
  current = openSession(code, role)
  return current
}

export function sortQuestions(list: Question[], order: 'top' | 'new'): Question[] {
  return [...list].sort(order === 'top' ? byVotes : byNewest)
}
