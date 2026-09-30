/**
 * The session's shape and its parsers, imported by both the Worker and the browser. Every
 * value that crosses the network or comes out of a room is run through one of these; none
 * is cast into its type.
 */

export const LIMITS = {
  title: 80,
  question: 280,
  author: 40,
  pollQuestion: 140,
  option: 60,
  minOptions: 2,
  maxOptions: 6,
  /** Questions per session, and per voter within one session. */
  questions: 500,
  questionsPerVoter: 20,
  polls: 50,
} as const

/** Join codes skip 0/O and 1/I/L, so a code read off a projector is typed right. */
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 6

export type QuestionState = 'open' | 'answered' | 'hidden'
export const QUESTION_STATES: readonly QuestionState[] = ['open', 'answered', 'hidden']

export interface Meta {
  title: string
  at: number
}

export interface Question {
  id: string
  text: string
  author: string | null
  at: number
  votes: number
  state: QuestionState
}

export interface Poll {
  id: string
  question: string
  options: string[]
  counts: number[]
  open: boolean
  at: number
}

export type Spotlight = { kind: 'question' | 'poll'; id: string } | null

export const REACTIONS = ['heart', 'clap', 'fire', 'laugh', 'wow'] as const
export type Reaction = (typeof REACTIONS)[number]

export type Role = 'audience' | 'host' | 'stage'

/** A connection's presence: who it is, and its latest reaction (`n` counts them up). */
export interface Presence {
  role: Role
  react?: { e: Reaction; n: number }
}

/* --------------------------------- helpers --------------------------------- */

function record(raw: unknown, what: string): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Expected ${what} to be an object`)
  }
  return raw as Record<string, unknown>
}

/** Trims, collapses whitespace runs, and enforces 1..max characters. */
export function cleanText(raw: unknown, what: string, max: number): string {
  if (typeof raw !== 'string') throw new Error(`${what} must be text`)
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length === 0) throw new Error(`${what} is empty`)
  if (text.length > max) throw new Error(`${what} is longer than ${max} characters`)
  return text
}

function count(raw: unknown, what: string): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) {
    throw new Error(`${what} must be a whole number`)
  }
  return raw
}

function time(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
    throw new Error('Expected a timestamp')
  }
  return raw
}

const ID = /^[a-z0-9]{6,32}$/
const VOTER = /^[A-Za-z0-9_-]{8,64}$/

function id(raw: unknown, what: string): string {
  if (typeof raw !== 'string' || !ID.test(raw)) throw new Error(`${what} is not a valid id`)
  return raw
}

/** Upper-cases a typed code and checks it against the alphabet. */
export function parseCode(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('A session code is text')
  const code = raw.trim().toUpperCase()
  if (code.length !== CODE_LENGTH || [...code].some((c) => !CODE_ALPHABET.includes(c))) {
    throw new Error(`A session code is ${CODE_LENGTH} letters and digits`)
  }
  return code
}

export function isCode(raw: string): boolean {
  try {
    parseCode(raw)
    return true
  } catch {
    return false
  }
}

/* ------------------------------ room values ------------------------------- */

export function parseMeta(raw: unknown): Meta {
  const r = record(raw, 'meta')
  return { title: cleanText(r['title'], 'The title', LIMITS.title), at: time(r['at']) }
}

/** A session that does not exist yet reads as `null`, the signal's initial value. */
export function parseMetaOrNull(raw: unknown): Meta | null {
  return raw === null ? null : parseMeta(raw)
}

export function parseQuestion(raw: unknown): Question {
  const r = record(raw, 'question')
  const state = r['state']
  if (!QUESTION_STATES.includes(state as QuestionState)) throw new Error('Unknown question state')
  return {
    id: id(r['id'], 'The question id'),
    text: cleanText(r['text'], 'The question', LIMITS.question),
    author: r['author'] === null ? null : cleanText(r['author'], 'The name', LIMITS.author),
    at: time(r['at']),
    votes: count(r['votes'], 'Votes'),
    state: state as QuestionState,
  }
}

export function parsePoll(raw: unknown): Poll {
  const r = record(raw, 'poll')
  const options = r['options']
  const counts = r['counts']
  if (!Array.isArray(options) || !Array.isArray(counts) || options.length !== counts.length) {
    throw new Error('A poll has one count per option')
  }
  if (options.length < LIMITS.minOptions || options.length > LIMITS.maxOptions) {
    throw new Error(`A poll has ${LIMITS.minOptions}–${LIMITS.maxOptions} options`)
  }
  if (typeof r['open'] !== 'boolean') throw new Error('Expected open to be a boolean')
  return {
    id: id(r['id'], 'The poll id'),
    question: cleanText(r['question'], 'The poll question', LIMITS.pollQuestion),
    options: options.map((o) => cleanText(o, 'An option', LIMITS.option)),
    counts: counts.map((c) => count(c, 'A count')),
    open: r['open'],
    at: time(r['at']),
  }
}

export function parseSpotlight(raw: unknown): Spotlight {
  if (raw === null) return null
  const r = record(raw, 'spotlight')
  if (r['kind'] !== 'question' && r['kind'] !== 'poll') throw new Error('Unknown spotlight kind')
  return { kind: r['kind'], id: id(r['id'], 'The spotlight id') }
}

/** Presence comes from any socket in the room: anything off-shape is dropped. */
export function parsePresence(raw: unknown): Presence {
  const r = record(raw, 'presence')
  const role = r['role']
  if (role !== 'audience' && role !== 'host' && role !== 'stage') throw new Error('Unknown role')
  const react = r['react']
  if (react === undefined) return { role }
  const x = record(react, 'reaction')
  if (!REACTIONS.includes(x['e'] as Reaction)) throw new Error('Unknown reaction')
  return { role, react: { e: x['e'] as Reaction, n: count(x['n'], 'The reaction count') } }
}

/* ------------------------------ API payloads ------------------------------ */

export function parseVoter(raw: unknown): string {
  if (typeof raw !== 'string' || !VOTER.test(raw)) throw new Error('Missing or invalid voter id')
  return raw
}

export interface CreateInput {
  title: string
}
export function parseCreateInput(raw: unknown): CreateInput {
  return { title: cleanText(record(raw, 'body')['title'], 'The title', LIMITS.title) }
}

export interface Created {
  code: string
  hostKey: string
}
export function parseCreated(raw: unknown): Created {
  const r = record(raw, 'response')
  if (typeof r['hostKey'] !== 'string' || r['hostKey'].length < 32) {
    throw new Error('Missing host key')
  }
  return { code: parseCode(r['code']), hostKey: r['hostKey'] }
}

export interface AskInput {
  text: string
  author: string | null
  voter: string
}
export function parseAskInput(raw: unknown): AskInput {
  const r = record(raw, 'body')
  const author = r['author']
  return {
    text: cleanText(r['text'], 'The question', LIMITS.question),
    author:
      author === null || author === undefined || (typeof author === 'string' && !author.trim())
        ? null
        : cleanText(author, 'The name', LIMITS.author),
    voter: parseVoter(r['voter']),
  }
}

export interface UpvoteInput {
  voter: string
  on: boolean
}
export function parseUpvoteInput(raw: unknown): UpvoteInput {
  const r = record(raw, 'body')
  if (typeof r['on'] !== 'boolean') throw new Error('Expected on to be a boolean')
  return { voter: parseVoter(r['voter']), on: r['on'] }
}

export interface VoteInput {
  voter: string
  option: number
}
export function parseVoteInput(raw: unknown): VoteInput {
  const r = record(raw, 'body')
  const option = r['option']
  if (typeof option !== 'number' || !Number.isInteger(option) || option < 0) {
    throw new Error('Expected an option index')
  }
  return { voter: parseVoter(r['voter']), option }
}

export interface ModerateInput {
  state: QuestionState
}
export function parseModerateInput(raw: unknown): ModerateInput {
  const state = record(raw, 'body')['state']
  if (!QUESTION_STATES.includes(state as QuestionState)) throw new Error('Unknown question state')
  return { state: state as QuestionState }
}

export interface PollInput {
  question: string
  options: string[]
}
export function parsePollInput(raw: unknown): PollInput {
  const r = record(raw, 'body')
  const options = r['options']
  if (!Array.isArray(options)) throw new Error('Expected a list of options')
  const cleaned = options
    .filter((o) => typeof o !== 'string' || o.trim() !== '')
    .map((o) => cleanText(o, 'An option', LIMITS.option))
  if (cleaned.length < LIMITS.minOptions || cleaned.length > LIMITS.maxOptions) {
    throw new Error(`A poll has ${LIMITS.minOptions}–${LIMITS.maxOptions} options`)
  }
  return {
    question: cleanText(r['question'], 'The poll question', LIMITS.pollQuestion),
    options: cleaned,
  }
}

export interface PollStateInput {
  open: boolean
}
export function parsePollStateInput(raw: unknown): PollStateInput {
  const open = record(raw, 'body')['open']
  if (typeof open !== 'boolean') throw new Error('Expected open to be a boolean')
  return { open }
}

export interface SpotlightInput {
  spotlight: Spotlight
}
export function parseSpotlightInput(raw: unknown): SpotlightInput {
  return { spotlight: parseSpotlight(record(raw, 'body')['spotlight']) }
}

export interface NewId {
  id: string
}
export function parseCreatedId(raw: unknown): NewId {
  return { id: id(record(raw, 'response')['id'], 'The id') }
}

export interface Ok {
  ok: true
}
export function parseOk(raw: unknown): Ok {
  if (record(raw, 'response')['ok'] !== true) throw new Error('Expected { ok: true }')
  return { ok: true }
}

/* --------------------------------- derived -------------------------------- */

/** Most votes first; ties go to the older question, so the order is stable. */
export function byVotes(a: Question, b: Question): number {
  return b.votes - a.votes || a.at - b.at
}

export function byNewest(a: Question, b: Question): number {
  return b.at - a.at
}

export function pollTotal(poll: Poll): number {
  return poll.counts.reduce((sum, n) => sum + n, 0)
}

/** Whole-number shares that add up to 100 (largest remainder), or all 0 with no votes. */
export function pollShares(poll: Poll): number[] {
  const total = pollTotal(poll)
  if (total === 0) return poll.counts.map(() => 0)
  const exact = poll.counts.map((n) => (n / total) * 100)
  const floors = exact.map(Math.floor)
  let left = 100 - floors.reduce((s, n) => s + n, 0)
  const order = exact.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r)
  for (const { i } of order) {
    if (left-- <= 0) break
    floors[i]! += 1
  }
  return floors
}
