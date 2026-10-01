// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { SyncRoomState } from '@cascivo/app/sync-server'
import worker from './index'
import type { Env } from './index'
import { StageRoom } from './stage-room'
import { parseCreated, parseCreatedId, parseQuestion } from '../src/model'

function memoryState(name: string): SyncRoomState {
  const store = new Map<string, unknown>()
  return {
    id: { name },
    acceptWebSocket: () => {},
    getWebSockets: () => [],
    storage: {
      get: async <T>(key: string) => store.get(key) as T | undefined,
      put: async (key, value) => void store.set(key, structuredClone(value)),
      delete: async (key) => store.delete(key),
      list: async <T>({ prefix }: { prefix: string }) =>
        new Map([...store].filter(([k]) => k.startsWith(prefix))) as Map<string, T>,
    },
  }
}

/** A Durable Object namespace of real StageRooms in memory, and a limiter that allows `limit` calls. */
function createEnv(limit = 100) {
  const rooms = new Map<string, { room: StageRoom; state: SyncRoomState }>()
  let calls = 0
  const env: Env = {
    STAGES: {
      idFromName: (name: string) => name,
      get: (id: unknown) => {
        const name = String(id)
        let entry = rooms.get(name)
        if (!entry) {
          const state = memoryState(name)
          entry = { room: new StageRoom(state), state }
          rooms.set(name, entry)
        }
        const { room } = entry
        return { fetch: (request: Request) => room.fetch(request) }
      },
    },
    CREATE_LIMIT: { limit: async () => ({ success: ++calls <= limit }) },
  }
  return { env, rooms }
}

const call = (env: Env, method: string, path: string, body?: unknown, key?: string) =>
  worker.fetch(
    new Request(`https://stage.test${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    env,
  )

async function start(env: Env) {
  const response = await call(env, 'POST', '/api/sessions', { title: 'Keynote' })
  expect(response.status).toBe(200)
  return parseCreated(await response.json())
}

describe('worker', () => {
  it('starts a session with a fresh code and a host key', async () => {
    const { env, rooms } = createEnv()
    const { code, hostKey } = await start(env)
    expect(code).toMatch(/^[A-Z2-9]{6}$/)
    expect(hostKey.length).toBeGreaterThanOrEqual(43)
    expect(rooms.has(code)).toBe(true)
  })

  it('rate-limits starting sessions', async () => {
    const { env } = createEnv(1)
    await start(env)
    const response = await call(env, 'POST', '/api/sessions', { title: 'Again' })
    expect(response.status).toBe(429)
  })

  it('takes questions from anyone, and checks their shape first', async () => {
    const { env, rooms } = createEnv()
    const { code } = await start(env)
    const bad = await call(env, 'POST', `/api/sessions/${code}/questions`, { text: 'Hi' })
    expect(bad.status).toBe(400) // no voter
    const good = await call(env, 'POST', `/api/sessions/${code}/questions`, {
      text: 'Hi',
      voter: 'voter-0001',
    })
    expect(good.status).toBe(200)
    const { id } = parseCreatedId(await good.json())
    const stored = await rooms.get(code)!.state.storage.get(`v:q/${id}`)
    expect(parseQuestion(stored).text).toBe('Hi')
  })

  it('needs the host key for host endpoints: 401 without, 403 with the wrong one', async () => {
    const { env } = createEnv()
    const { code, hostKey } = await start(env)
    const poll = { question: 'Ship it?', options: ['Yes', 'No'] }
    expect((await call(env, 'POST', `/api/sessions/${code}/polls`, poll)).status).toBe(401)
    expect(
      (await call(env, 'POST', `/api/sessions/${code}/polls`, poll, 'x'.repeat(43))).status,
    ).toBe(403)
    expect((await call(env, 'POST', `/api/sessions/${code}/polls`, poll, hostKey)).status).toBe(200)
    expect((await call(env, 'GET', `/api/sessions/${code}/host`, undefined, hostKey)).status).toBe(
      200,
    )
  })

  it('answers 404 for a code that cannot exist, before touching a room', async () => {
    const { env, rooms } = createEnv()
    const response = await call(env, 'POST', '/api/sessions/nope!/questions', {
      text: 'Hi',
      voter: 'voter-0001',
    })
    expect(response.status).toBe(404)
    const room = await call(env, 'GET', '/api/sessions/..%2F..%2Fx/room')
    expect(room.status).toBe(404)
    expect(rooms.size).toBe(0)
  })

  it('opens the room only as a WebSocket upgrade', async () => {
    const { env } = createEnv()
    const { code } = await start(env)
    const response = await call(env, 'GET', `/api/sessions/${code}/room`)
    expect(response.status).toBe(426)
  })
})
