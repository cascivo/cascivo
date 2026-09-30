import { computed } from '@cascivo/core'
import { persistedSignal } from '@cascivo/storage'
import { parseCode, parseVoter } from './model'

/**
 * What this browser remembers, in localStorage. Storage is written by this code but also by
 * older versions of it and by hand in devtools, so every read goes through a parser and a
 * bad entry is dropped, never trusted.
 */

export interface Hosted {
  code: string
  key: string
  title: string
  at: number
}

function parseHosted(raw: unknown): Hosted | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { code, key, title, at } = raw as Record<string, unknown>
  try {
    if (typeof key !== 'string' || key.length < 32 || typeof title !== 'string') return null
    if (typeof at !== 'number') return null
    return { code: parseCode(code), key, title, at }
  } catch {
    return null
  }
}

const hostedStore = persistedSignal<unknown>('stage.hosted', {})
const voterStore = persistedSignal<unknown>('stage.voter', '')
const upvotedStore = persistedSignal<unknown>('stage.upvoted', {})
const votesStore = persistedSignal<unknown>('stage.votes', {})

export type ThemeName = 'midnight' | 'light'
const themeStore = persistedSignal<unknown>('stage.theme', 'midnight')
export const theme = computed<ThemeName>(() =>
  themeStore.value === 'light' ? 'light' : 'midnight',
)
export function toggleTheme(): void {
  themeStore.value = theme.value === 'light' ? 'midnight' : 'light'
}

function entries(raw: unknown): [string, unknown][] {
  return typeof raw === 'object' && raw !== null ? Object.entries(raw) : []
}

/** Sessions started in this browser, newest first. */
export const hosted = computed<Hosted[]>(() =>
  entries(hostedStore.value)
    .map(([, value]) => parseHosted(value))
    .filter((h): h is Hosted => h !== null)
    .sort((a, b) => b.at - a.at),
)

export function hostKey(code: string): string | null {
  return hosted.value.find((h) => h.code === code)?.key ?? null
}

export function rememberHost(entry: Hosted): void {
  hostedStore.value = { ...Object.fromEntries(entries(hostedStore.value)), [entry.code]: entry }
}

/** This browser's anonymous id: one vote per question and poll, and nothing else. */
export function voter(): string {
  try {
    return parseVoter(voterStore.value)
  } catch {
    const id = crypto.randomUUID().replace(/-/g, '')
    voterStore.value = id
    return id
  }
}

const upvoteKey = (code: string, id: string) => `${code}:${id}`

export const upvoted = computed<ReadonlySet<string>>(
  () =>
    new Set(
      entries(upvotedStore.value)
        .filter(([, v]) => v === true)
        .map(([k]) => k),
    ),
)

export function hasUpvoted(code: string, id: string): boolean {
  return upvoted.value.has(upvoteKey(code, id))
}

export function setUpvoted(code: string, id: string, on: boolean): void {
  const next = Object.fromEntries(entries(upvotedStore.value))
  if (on) next[upvoteKey(code, id)] = true
  else delete next[upvoteKey(code, id)]
  upvotedStore.value = next
}

/** The option this browser picked in a poll, or `null`. */
export function myVote(code: string, pollId: string): number | null {
  const value = Object.fromEntries(entries(votesStore.value))[upvoteKey(code, pollId)]
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}

export function setMyVote(code: string, pollId: string, option: number): void {
  votesStore.value = {
    ...Object.fromEntries(entries(votesStore.value)),
    [upvoteKey(code, pollId)]: option,
  }
}
