import { computed } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { parseCode, parseVoter } from './model'

/**
 * What this browser remembers, in localStorage. Storage is written by this code but also by
 * older versions of it and by hand in devtools, so each signal parses what it reads back
 * (`parse`): a bad entry is dropped, never trusted.
 */

export interface Hosted {
  code: string
  key: string
  title: string
  at: number
}

type Hosts = Record<string, Hosted>

function record(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Expected an object')
  }
  return raw as Record<string, unknown>
}

/** Keeps the entries of a stored map that parse, and drops the rest. */
function entriesOf<T>(raw: unknown, parse: (value: unknown) => T): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [key, value] of Object.entries(record(raw))) {
    try {
      out[key] = parse(value)
    } catch {
      // One bad entry does not cost the others.
    }
  }
  return out
}

function parseHosted(raw: unknown): Hosted {
  const { code, key, title, at } = record(raw)
  if (typeof key !== 'string' || key.length < 32) throw new Error('Bad host key')
  if (typeof title !== 'string' || typeof at !== 'number') throw new Error('Bad session')
  return { code: parseCode(code), key, title, at }
}

function parseTrue(raw: unknown): true {
  if (raw !== true) throw new Error('Expected true')
  return true
}

function parseOption(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) {
    throw new Error('Expected an option index')
  }
  return raw
}

const hostedStore = persistedSignal<Hosts>(
  'stage.hosted',
  {},
  { parse: (raw) => entriesOf(raw, parseHosted) },
)
// '' until the first vote or question assigns one.
const voterStore = persistedSignal<string>('stage.voter', '', {
  parse: (raw) => (raw === '' ? '' : parseVoter(raw)),
})
const upvotedStore = persistedSignal<Record<string, true>>(
  'stage.upvoted',
  {},
  { parse: (raw) => entriesOf(raw, parseTrue) },
)
const votesStore = persistedSignal<Record<string, number>>(
  'stage.votes',
  {},
  { parse: (raw) => entriesOf(raw, parseOption) },
)

export type ThemeName = 'midnight' | 'light'
const themeStore = persistedSignal<ThemeName>('stage.theme', 'midnight', {
  parse: (raw) => (raw === 'light' ? 'light' : 'midnight'),
})
export const theme = computed(() => themeStore.value)
export function toggleTheme(): void {
  themeStore.value = themeStore.value === 'light' ? 'midnight' : 'light'
}

/** Sessions started in this browser, newest first. */
export const hosted = computed<Hosted[]>(() =>
  Object.values(hostedStore.value).sort((a, b) => b.at - a.at),
)

export function hostKey(code: string): string | null {
  return hostedStore.value[code]?.key ?? null
}

export function rememberHost(entry: Hosted): void {
  hostedStore.value = { ...hostedStore.value, [entry.code]: entry }
}

/** This browser's anonymous id: one vote per question and poll, and nothing else. */
export function voter(): string {
  if (voterStore.value) return voterStore.value
  const id = crypto.randomUUID().replace(/-/g, '')
  voterStore.value = id
  return id
}

const localKey = (code: string, id: string) => `${code}:${id}`

export function hasUpvoted(code: string, id: string): boolean {
  return upvotedStore.value[localKey(code, id)] === true
}

export function setUpvoted(code: string, id: string, on: boolean): void {
  const next = { ...upvotedStore.value }
  if (on) next[localKey(code, id)] = true
  else delete next[localKey(code, id)]
  upvotedStore.value = next
}

/** The option this browser picked in a poll, or `null`. */
export function myVote(code: string, pollId: string): number | null {
  return votesStore.value[localKey(code, pollId)] ?? null
}

export function setMyVote(code: string, pollId: string, option: number): void {
  votesStore.value = { ...votesStore.value, [localKey(code, pollId)]: option }
}
