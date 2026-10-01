// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HibernatableWebSocket, SyncRoomState } from '@cascivo/app/sync-server'
import { COMMAND_HEADER, REACTIONS_PER_SECOND, sanitizePresence, StageRoom } from './stage-room'
import type { Command } from './stage-room'
import { LIMITS, parsePoll, parseQuestion } from '../src/model'

class Socket implements HibernatableWebSocket {
  sent: { t: string; path?: string; value?: unknown; message?: string }[] = []
  attachment: unknown
  send(message: string) {
    this.sent.push(JSON.parse(message))
  }
  close() {}
  serializeAttachment(value: unknown) {
    this.attachment = structuredClone(value)
  }
  deserializeAttachment() {
    return this.attachment
  }
}

function createRoom() {
  const open: Socket[] = []
  const store = new Map<string, unknown>()
  const ctx: SyncRoomState = {
    id: { name: 'ABC234' },
    acceptWebSocket: (socket) => open.push(socket as Socket),
    getWebSockets: () => [...open],
    storage: {
      get: async <T>(key: string) => store.get(key) as T | undefined,
      put: async (key, value) => void store.set(key, structuredClone(value)),
      delete: async (key) => store.delete(key),
      list: async <T>({ prefix }: { prefix: string }) =>
        new Map([...store].filter(([k]) => k.startsWith(prefix))) as Map<string, T>,
    },
  }
  const room = new StageRoom(ctx)
  const send = async (command: Command | Record<string, unknown>) => {
    const response = await room.fetch(
      new Request('https://stage.internal/command', {
        method: 'POST',
        headers: { [COMMAND_HEADER]: '1' },
        body: JSON.stringify(command),
      }),
    )
    return { status: response.status, body: (await response.json()) as Record<string, unknown> }
  }
  const join = async () => {
    const socket = new Socket()
    await room.accept(socket, { readOnly: true })
    return socket
  }
  /** The value at a room path, as the sockets see it. */
  const value = (path: string) => store.get(`v:${path}`)
  return { room, store, send, join, value }
}

const KEY = 'k'.repeat(43)
const VOTER = 'voter-0001'

async function started() {
  const room = createRoom()
  expect((await room.send({ op: 'create', title: 'All hands', hostKey: KEY })).status).toBe(200)
  return room
}

async function askOne(room: ReturnType<typeof createRoom>, text = 'Why?') {
  const { body } = await room.send({ op: 'ask', body: { text, author: null, voter: VOTER } })
  return body['id'] as string
}

describe('StageRoom — sessions', () => {
  it('creates a session once; a second create on the same code is a 409', async () => {
    const room = await started()
    expect(room.value('meta')).toMatchObject({ title: 'All hands' })
    const again = await room.send({ op: 'create', title: 'Other', hostKey: KEY })
    expect(again.status).toBe(409)
    expect(room.value('meta')).toMatchObject({ title: 'All hands' })
  })

  it('answers 404 for every command on a session nobody started', async () => {
    const room = createRoom()
    const { status } = await room.send({ op: 'ask', body: { text: 'Hi', voter: VOTER } })
    expect(status).toBe(404)
  })

  it('never puts the host key, or its hash, where a socket can read it', async () => {
    const room = await started()
    const socket = await room.join()
    const hello = JSON.stringify(socket.sent[0])
    expect(hello).not.toContain(KEY)
    expect(hello).not.toContain(room.store.get('x:host') as string)
    expect([...room.store.keys()].filter((k) => k.startsWith('v:'))).toEqual(['v:meta'])
  })

  it('ignores commands that do not carry the Worker header', async () => {
    const room = await started()
    const response = await room.room.fetch(
      new Request('https://stage.internal/command', {
        method: 'POST',
        body: JSON.stringify({ op: 'check', key: KEY }),
      }),
    )
    expect(response.status).toBe(426) // treated as a (failed) WebSocket upgrade
  })

  it('rejects unknown commands and malformed JSON with a 400', async () => {
    const room = await started()
    expect((await room.send({ op: 'drop-tables' })).status).toBe(400)
    const response = await room.room.fetch(
      new Request('https://stage.internal/command', {
        method: 'POST',
        headers: { [COMMAND_HEADER]: '1' },
        body: '{',
      }),
    )
    expect(response.status).toBe(400)
  })
})

describe('StageRoom — questions', () => {
  it('stores a question the audience asked, cleaned, and sends it to every socket', async () => {
    const room = await started()
    const socket = await room.join()
    const { status, body } = await room.send({
      op: 'ask',
      body: { text: '  How   does it scale? ', author: ' Ada ', voter: VOTER },
    })
    expect(status).toBe(200)
    const question = parseQuestion(room.value(`q/${body['id']}`))
    expect(question).toMatchObject({
      text: 'How does it scale?',
      author: 'Ada',
      votes: 0,
      state: 'open',
    })
    expect(socket.sent.at(-1)).toMatchObject({ t: 'set', path: `q/${body['id']}` })
  })

  it('refuses an empty or too-long question with the parser message', async () => {
    const room = await started()
    const empty = await room.send({ op: 'ask', body: { text: '   ', voter: VOTER } })
    expect(empty).toEqual({ status: 400, body: { error: 'The question is empty' } })
    const long = await room.send({
      op: 'ask',
      body: { text: 'x'.repeat(LIMITS.question + 1), voter: VOTER },
    })
    expect(long.status).toBe(400)
  })

  it('caps questions per voter', async () => {
    const room = await started()
    for (let i = 0; i < LIMITS.questionsPerVoter; i++) await askOne(room, `Q${i}`)
    const { status } = await room.send({ op: 'ask', body: { text: 'One more', voter: VOTER } })
    expect(status).toBe(429)
  })

  it('counts one upvote per voter, and takes it back', async () => {
    const room = await started()
    const id = await askOne(room)
    const up = { op: 'upvote', id, body: { voter: VOTER, on: true } }
    await room.send(up)
    await room.send(up) // the same voter again: no change
    await room.send({ op: 'upvote', id, body: { voter: 'voter-0002', on: true } })
    expect(parseQuestion(room.value(`q/${id}`)).votes).toBe(2)
    await room.send({ op: 'upvote', id, body: { voter: VOTER, on: false } })
    expect(parseQuestion(room.value(`q/${id}`)).votes).toBe(1)
  })

  it('counts concurrent upvotes exactly', async () => {
    const room = await started()
    const id = await askOne(room)
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        room.send({ op: 'upvote', id, body: { voter: `voter-${1000 + i}`, on: true } }),
      ),
    )
    expect(parseQuestion(room.value(`q/${id}`)).votes).toBe(25)
  })

  it('lets only the host moderate', async () => {
    const room = await started()
    const id = await askOne(room)
    const denied = await room.send({
      op: 'moderate',
      key: 'wrong'.repeat(9),
      id,
      body: { state: 'hidden' },
    })
    expect(denied.status).toBe(403)
    expect(parseQuestion(room.value(`q/${id}`)).state).toBe('open')
    await room.send({ op: 'moderate', key: KEY, id, body: { state: 'answered' } })
    expect(parseQuestion(room.value(`q/${id}`)).state).toBe('answered')
  })
})

describe('StageRoom — polls', () => {
  async function withPoll() {
    const room = await started()
    const { body } = await room.send({
      op: 'createPoll',
      key: KEY,
      body: { question: 'Tabs or spaces?', options: ['Tabs', 'Spaces', ''] },
    })
    return { room, id: body['id'] as string }
  }

  it('creates a closed draft, dropping blank options', async () => {
    const { room, id } = await withPoll()
    expect(parsePoll(room.value(`p/${id}`))).toMatchObject({
      options: ['Tabs', 'Spaces'],
      counts: [0, 0],
      open: false,
    })
  })

  it('refuses votes until launched, then counts one vote per voter, changeable', async () => {
    const { room, id } = await withPoll()
    const vote = (voter: string, option: number) =>
      room.send({ op: 'vote', id, body: { voter, option } })
    expect((await vote(VOTER, 0)).status).toBe(409)

    await room.send({ op: 'setPoll', key: KEY, id, body: { open: true } })
    expect(room.value('spotlight')).toEqual({ kind: 'poll', id })
    await vote(VOTER, 0)
    await vote(VOTER, 0)
    await vote('voter-0002', 1)
    expect(parsePoll(room.value(`p/${id}`)).counts).toEqual([1, 1])
    await vote(VOTER, 1) // changed their mind
    expect(parsePoll(room.value(`p/${id}`)).counts).toEqual([0, 2])
    expect((await vote(VOTER, 5)).status).toBe(400)
  })

  it('keeps one poll open at a time', async () => {
    const { room, id } = await withPoll()
    const second = await room.send({
      op: 'createPoll',
      key: KEY,
      body: { question: 'Coffee or tea?', options: ['Coffee', 'Tea'] },
    })
    const other = second.body['id'] as string
    await room.send({ op: 'setPoll', key: KEY, id, body: { open: true } })
    await room.send({ op: 'setPoll', key: KEY, id: other, body: { open: true } })
    expect(parsePoll(room.value(`p/${id}`)).open).toBe(false)
    expect(parsePoll(room.value(`p/${other}`)).open).toBe(true)
  })

  it('spotlights only things that exist', async () => {
    const room = await started()
    const missing = await room.send({
      op: 'spotlight',
      key: KEY,
      body: { spotlight: { kind: 'question', id: 'nosuchid' } },
    })
    expect(missing.status).toBe(404)
    const id = await askOne(room)
    await room.send({ op: 'spotlight', key: KEY, body: { spotlight: { kind: 'question', id } } })
    expect(room.value('spotlight')).toEqual({ kind: 'question', id })
    await room.send({ op: 'spotlight', key: KEY, body: { spotlight: null } })
    expect(room.value('spotlight')).toBeUndefined() // null deletes the path
  })
})

describe('StageRoom — sockets', () => {
  const presence = (value: unknown) => JSON.stringify({ t: 'presence', value })

  it('relays only a parsed presence: a role and a known reaction', () => {
    expect(sanitizePresence(presence({ role: 'audience', react: { e: 'fire', n: 3 }, x: 1 }))).toBe(
      presence({ role: 'audience', react: { e: 'fire', n: 3 } }),
    )
    expect(sanitizePresence(presence(null))).toBe(presence(null))
    for (const raw of [
      presence({ role: 'admin' }),
      presence({ role: 'audience', react: { e: '<script>', n: 1 } }),
      presence({ role: 'audience', react: { e: 'fire', n: -1 } }),
      JSON.stringify({ t: 'set', id: '1', path: 'meta', value: { title: 'pwned', at: 0 } }),
      'x'.repeat(400),
      new ArrayBuffer(2),
    ]) {
      expect(sanitizePresence(raw)).toBeUndefined()
    }
  })

  it('never stores a write sent over the socket', async () => {
    const room = await started()
    const socket = await room.join()
    await room.room.webSocketMessage(
      socket,
      JSON.stringify({ t: 'set', id: '1', path: 'meta', value: { title: 'pwned', at: 0 } }),
    )
    expect(room.value('meta')).toMatchObject({ title: 'All hands' })
  })

  afterEach(() => vi.restoreAllMocks())

  it('rate-limits reactions per socket', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const room = await started()
    const a = await room.join()
    const b = await room.join()
    b.sent = []
    for (let n = 1; n <= REACTIONS_PER_SECOND + 5; n++) {
      await room.room.webSocketMessage(a, presence({ role: 'audience', react: { e: 'heart', n } }))
    }
    expect(b.sent).toHaveLength(REACTIONS_PER_SECOND)
  })
})
