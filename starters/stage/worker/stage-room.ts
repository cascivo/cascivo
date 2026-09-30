import { SyncRoom } from '@cascivo/app/sync-server'
import type { HibernatableWebSocket } from '@cascivo/app/sync-server'
import {
  cleanText,
  LIMITS,
  parseAskInput,
  parseModerateInput,
  parsePoll,
  parsePollInput,
  parsePollStateInput,
  parsePresence,
  parseQuestion,
  parseSpotlightInput,
  parseUpvoteInput,
  parseVoteInput,
} from '../src/model'
import type { Poll, Question } from '../src/model'

/**
 * One session: a `SyncRoom` that browsers may watch but never write. Everything the page
 * shows lives at a room path (`meta`, `q/<id>`, `p/<id>`, `spotlight`) and every change to
 * it arrives here as a command from the Worker, which this object checks and applies one
 * at a time — so a vote is counted exactly once, and only the host key moderates.
 *
 * What the room must never show — the host key's hash, who voted for what — is stored
 * under keys outside the room's value space, so it is never sent to a socket.
 */

/** Set by the Worker on its own requests; `roomResponse` strips every `x-cascivo-room-*` header a browser sends. */
export const COMMAND_HEADER = 'x-cascivo-room-stage-command'

/** Reactions a socket may send per second; the page sends at most a few. */
export const REACTIONS_PER_SECOND = 4

const HOST = 'x:host'
const questionVote = (id: string, voter: string) => `x:qv:${id}:${voter}`
const pollVote = (id: string, voter: string) => `x:pv:${id}:${voter}`
const asked = (voter: string) => `x:asked:${voter}`

export type Command =
  | { op: 'create'; title: string; hostKey: string }
  | { op: 'check'; key: string }
  | { op: 'ask'; body: unknown }
  | { op: 'upvote'; id: string; body: unknown }
  | { op: 'vote'; id: string; body: unknown }
  | { op: 'moderate'; key: string; id: string; body: unknown }
  | { op: 'createPoll'; key: string; body: unknown }
  | { op: 'setPoll'; key: string; id: string; body: unknown }
  | { op: 'spotlight'; key: string; body: unknown }

class CommandError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** A 10-character id from [a-z0-9]: short in a path, and never guessed. */
export function newId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return [...crypto.getRandomValues(new Uint8Array(10))].map((b) => alphabet[b % 36]).join('')
}

function field(raw: Record<string, unknown>, key: string): string {
  const value = raw[key]
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    throw new CommandError(400, `Expected ${key}`)
  }
  return value
}

/** The command's envelope. Each body is parsed by its own parser in `run`. */
export function parseCommand(raw: unknown): Command {
  if (typeof raw !== 'object' || raw === null) throw new CommandError(400, 'Expected a command')
  const r = raw as Record<string, unknown>
  switch (r['op']) {
    case 'create':
      return {
        op: 'create',
        title: parsed((raw) => cleanText(raw, 'The title', LIMITS.title), r['title']),
        hostKey: field(r, 'hostKey'),
      }
    case 'check':
      return { op: 'check', key: field(r, 'key') }
    case 'ask':
      return { op: 'ask', body: r['body'] }
    case 'upvote':
    case 'vote':
      return { op: r['op'], id: field(r, 'id'), body: r['body'] }
    case 'moderate':
    case 'setPoll':
      return { op: r['op'], key: field(r, 'key'), id: field(r, 'id'), body: r['body'] }
    case 'createPoll':
    case 'spotlight':
      return { op: r['op'], key: field(r, 'key'), body: r['body'] }
    default:
      throw new CommandError(400, 'Unknown command')
  }
}

/** A parse failure in a body is the caller's mistake: a 400 with the parser's message. */
function parsed<T>(parse: (raw: unknown) => T, raw: unknown): T {
  try {
    return parse(raw)
  } catch (error) {
    throw new CommandError(400, error instanceof Error ? error.message : 'Bad request')
  }
}

/**
 * A presence message as `@cascivo/app/sync` sends it, re-serialized from its parsed value, or
 * `undefined` for anything else. Sockets here are read-only, so presence is all they send.
 */
export function sanitizePresence(raw: string | ArrayBuffer): string | undefined {
  if (typeof raw !== 'string' || raw.length > 300) return undefined
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return undefined
    const { t, value } = data as Record<string, unknown>
    if (t !== 'presence') return undefined
    const presence = value === null ? null : parsePresence(value)
    return JSON.stringify({ t: 'presence', value: presence })
  } catch {
    return undefined
  }
}

export class StageRoom extends SyncRoom {
  /** Commands run one at a time: a count read, bumped and written back cannot interleave. */
  private queue: Promise<unknown> = Promise.resolve()
  private readonly rates = new WeakMap<HibernatableWebSocket, { second: number; count: number }>()

  override async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST' && request.headers.get(COMMAND_HEADER) === '1') {
      const result = this.queue.then(() => this.handle(request))
      this.queue = result.catch(() => {})
      return result
    }
    return super.fetch(request)
  }

  override async webSocketMessage(
    socket: HibernatableWebSocket,
    raw: string | ArrayBuffer,
  ): Promise<void> {
    const message = sanitizePresence(raw)
    if (message === undefined || !this.allow(socket)) return
    await super.webSocketMessage(socket, message)
  }

  private allow(socket: HibernatableWebSocket): boolean {
    const second = Math.floor(Date.now() / 1000)
    const rate = this.rates.get(socket)
    if (!rate || rate.second !== second) {
      this.rates.set(socket, { second, count: 1 })
      return true
    }
    rate.count += 1
    return rate.count <= REACTIONS_PER_SECOND
  }

  private async handle(request: Request): Promise<Response> {
    try {
      const command = parseCommand(await request.json())
      return Response.json(await this.run(command))
    } catch (error) {
      if (error instanceof CommandError) {
        return Response.json({ error: error.message }, { status: error.status })
      }
      if (error instanceof SyntaxError) {
        return Response.json({ error: 'Expected JSON' }, { status: 400 })
      }
      throw error
    }
  }

  private async run(command: Command): Promise<object> {
    if (command.op === 'create') return this.create(command.title, command.hostKey)
    if (!(await this.read('meta'))) throw new CommandError(404, 'No session with this code')

    switch (command.op) {
      case 'check':
        await this.requireHost(command.key)
        return { ok: true }
      case 'ask':
        return this.ask(command.body)
      case 'upvote':
        return this.upvote(command.id, command.body)
      case 'vote':
        return this.vote(command.id, command.body)
      case 'moderate': {
        await this.requireHost(command.key)
        const { state } = parsed(parseModerateInput, command.body)
        const question = await this.question(command.id)
        await this.write(`q/${question.id}`, { ...question, state })
        return { ok: true }
      }
      case 'createPoll':
        await this.requireHost(command.key)
        return this.createPoll(command.body)
      case 'setPoll': {
        await this.requireHost(command.key)
        const { open } = parsed(parsePollStateInput, command.body)
        const poll = await this.poll(command.id)
        if (open) await this.closeOtherPolls(poll.id)
        await this.write(`p/${poll.id}`, { ...poll, open })
        if (open) await this.write('spotlight', { kind: 'poll', id: poll.id })
        return { ok: true }
      }
      case 'spotlight': {
        await this.requireHost(command.key)
        const { spotlight } = parsed(parseSpotlightInput, command.body)
        if (spotlight?.kind === 'question') await this.question(spotlight.id)
        if (spotlight?.kind === 'poll') await this.poll(spotlight.id)
        await this.write('spotlight', spotlight)
        return { ok: true }
      }
    }
  }

  private async create(title: string, hostKey: string): Promise<object> {
    if (await this.read('meta')) throw new CommandError(409, 'This code is taken')
    await this.ctx.storage.put(HOST, await sha256(hostKey))
    await this.write('meta', { title, at: Date.now() })
    return { ok: true }
  }

  private async requireHost(key: string): Promise<void> {
    const stored = await this.ctx.storage.get<string>(HOST)
    if (!stored || stored !== (await sha256(key))) {
      throw new CommandError(403, 'Only the host can do this')
    }
  }

  private async question(id: string): Promise<Question> {
    const raw = await this.read(`q/${id}`)
    if (raw === undefined) throw new CommandError(404, 'No such question')
    return parseQuestion(raw)
  }

  private async poll(id: string): Promise<Poll> {
    const raw = await this.read(`p/${id}`)
    if (raw === undefined) throw new CommandError(404, 'No such poll')
    return parsePoll(raw)
  }

  private async ask(body: unknown): Promise<object> {
    const input = parsed(parseAskInput, body)
    if ((await this.paths('q/')).length >= LIMITS.questions) {
      throw new CommandError(429, 'This session has all the questions it can hold')
    }
    const mine = (await this.ctx.storage.get<number>(asked(input.voter))) ?? 0
    if (mine >= LIMITS.questionsPerVoter) {
      throw new CommandError(429, `You can ask up to ${LIMITS.questionsPerVoter} questions`)
    }
    await this.ctx.storage.put(asked(input.voter), mine + 1)
    const question: Question = {
      id: newId(),
      text: input.text,
      author: input.author,
      at: Date.now(),
      votes: 0,
      state: 'open',
    }
    await this.write(`q/${question.id}`, { ...question })
    return { id: question.id }
  }

  private async upvote(id: string, body: unknown): Promise<object> {
    const { voter, on } = parsed(parseUpvoteInput, body)
    const question = await this.question(id)
    const key = questionVote(id, voter)
    const had = (await this.ctx.storage.get<boolean>(key)) === true
    if (had === on) return { ok: true }
    if (on) await this.ctx.storage.put(key, true)
    else await this.ctx.storage.delete(key)
    await this.write(`q/${id}`, { ...question, votes: Math.max(0, question.votes + (on ? 1 : -1)) })
    return { ok: true }
  }

  private async vote(id: string, body: unknown): Promise<object> {
    const { voter, option } = parsed(parseVoteInput, body)
    const poll = await this.poll(id)
    if (!poll.open) throw new CommandError(409, 'This poll is closed')
    if (option >= poll.options.length) throw new CommandError(400, 'No such option')
    const key = pollVote(id, voter)
    const previous = await this.ctx.storage.get<number>(key)
    if (previous === option) return { ok: true }
    const counts = [...poll.counts]
    if (previous !== undefined && previous < counts.length) {
      counts[previous] = Math.max(0, counts[previous]! - 1)
    }
    counts[option] = counts[option]! + 1
    await this.ctx.storage.put(key, option)
    await this.write(`p/${id}`, { ...poll, counts })
    return { ok: true }
  }

  private async createPoll(body: unknown): Promise<object> {
    const input = parsed(parsePollInput, body)
    if ((await this.paths('p/')).length >= LIMITS.polls) {
      throw new CommandError(429, `A session holds up to ${LIMITS.polls} polls`)
    }
    const poll: Poll = {
      id: newId(),
      question: input.question,
      options: input.options,
      counts: input.options.map(() => 0),
      open: false,
      at: Date.now(),
    }
    await this.write(`p/${poll.id}`, { ...poll })
    return { id: poll.id }
  }

  /** One poll takes votes at a time, so the audience is never asked two things at once. */
  private async closeOtherPolls(except: string): Promise<void> {
    for (const path of await this.paths('p/')) {
      if (path === `p/${except}`) continue
      const raw = await this.read(path)
      if (raw === undefined) continue
      const poll = parsePoll(raw)
      if (poll.open) await this.write(path, { ...poll, open: false })
    }
  }
}
