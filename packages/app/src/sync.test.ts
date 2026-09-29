import { afterEach, describe, expect, it, vi } from 'vitest'
import { connectRoom } from './sync'
import type { Room } from './sync'
import { roomResponse, SyncRoom } from './sync-server'
import type { HibernatableWebSocket, SyncRoomState } from './sync-server'

/** An in-memory Durable Object host: one SyncRoom, real storage semantics, async delivery. */
function createHub() {
  const storage = new Map<string, unknown>()
  const open: ServerSocket[] = []
  const ctx: SyncRoomState = {
    acceptWebSocket: (socket) => open.push(socket as ServerSocket),
    getWebSockets: () => [...open],
    storage: {
      get: async (key) => storage.get(key) as never,
      put: async (key, value) => void storage.set(key, structuredClone(value)),
      delete: async (key) => storage.delete(key),
      list: async ({ prefix }) =>
        new Map([...storage].filter(([key]) => key.startsWith(prefix)).sort()) as never,
    },
  }
  const room = new SyncRoom(ctx)
  // Server work is serialized, like a Durable Object's input gate.
  let queue = Promise.resolve()
  const serially = (task: () => Promise<void>) => (queue = queue.then(task))

  class ServerSocket implements HibernatableWebSocket {
    attachment: unknown
    constructor(readonly client: FakeClient) {}
    send(message: string) {
      setTimeout(() => this.client.receive(message), 0)
    }
    close() {}
    serializeAttachment(value: unknown) {
      this.attachment = structuredClone(value)
    }
    deserializeAttachment() {
      return this.attachment
    }
  }

  const clients: FakeClient[] = []

  class FakeClient {
    readyState = 0
    server: ServerSocket
    listeners: Record<string, ((event: unknown) => void)[]> = {}
    constructor(_url: string) {
      clients.push(this)
      this.server = new ServerSocket(this)
      serially(async () => {
        this.readyState = 1
        await room.accept(this.server)
      })
    }
    addEventListener(type: string, listener: (event: unknown) => void) {
      ;(this.listeners[type] ??= []).push(listener)
    }
    receive(data: string) {
      if (this.readyState !== 1) return
      for (const listener of this.listeners['message'] ?? []) listener({ data })
    }
    send(data: string) {
      serially(() => room.webSocketMessage(this.server, data))
    }
    close() {
      if (this.readyState === 3) return
      this.readyState = 3
      open.splice(open.indexOf(this.server), 1)
      serially(() => room.webSocketClose(this.server))
      setTimeout(() => {
        for (const listener of this.listeners['close'] ?? []) listener({})
      }, 0)
    }
  }

  return {
    room,
    storage,
    clients,
    FakeClient: FakeClient as unknown as new (url: string) => WebSocket,
  }
}

const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0))
}

const parseString = (raw: unknown): string => {
  if (typeof raw !== 'string') throw new Error('not a string')
  return raw
}
const parseNote = (raw: unknown): { text: string } => {
  if (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { text?: unknown }).text === 'string'
  ) {
    return { text: (raw as { text: string }).text }
  }
  throw new Error('not a note')
}

const rooms: Room[] = []
function join(hub: ReturnType<typeof createHub>): Room {
  const room = connectRoom('ws://test/room', {
    WebSocket: hub.FakeClient,
    minReconnectMs: 1,
    maxReconnectMs: 1,
  })
  rooms.push(room)
  return room
}
afterEach(() => {
  for (const room of rooms.splice(0)) room.close()
  vi.restoreAllMocks()
})

describe('connectRoom + SyncRoom', () => {
  it('connects, and a write reaches everyone in the room', async () => {
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    expect(a.status.value).toBe('open')
    const titleA = a.signal('title', 'Untitled', parseString)
    const titleB = b.signal('title', 'Untitled', parseString)
    expect(titleB.value).toBe('Untitled')

    titleA.set('Roadmap')
    expect(titleA.value).toBe('Roadmap') // optimistic, before the room confirms
    await settle()
    expect(titleB.value).toBe('Roadmap')
  })

  it('settles concurrent writes to one path on the room order, for everyone', async () => {
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    const ta = a.signal('title', '', parseString)
    const tb = b.signal('title', '', parseString)
    ta.set('from A')
    tb.set('from B')
    // Each sees its own write first…
    expect([ta.value, tb.value]).toEqual(['from A', 'from B'])
    await settle()
    // …then both converge on whatever the room applied last.
    expect(ta.value).toBe(tb.value)
    expect(hub.storage.get('v:title')).toBe(ta.value)
  })

  it('keeps concurrent writes to different map entries', async () => {
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    a.map('notes', parseNote).set('1', { text: 'one' })
    b.map('notes', parseNote).set('2', { text: 'two' })
    await settle()
    const expected = { '1': { text: 'one' }, '2': { text: 'two' } }
    expect(a.map('notes', parseNote).value).toEqual(expected)
    expect(b.map('notes', parseNote).value).toEqual(expected)

    b.map('notes', parseNote).delete('1')
    await settle()
    expect(a.map('notes', parseNote).value).toEqual({ '2': { text: 'two' } })
  })

  it('persists values for people who join later', async () => {
    const hub = createHub()
    const a = join(hub)
    await settle()
    a.signal('title', '', parseString).set('Kept')
    await settle()
    a.close()
    const late = join(hub)
    await settle()
    expect(late.signal('title', '', parseString).value).toBe('Kept')
  })

  it("ignores a peer's value that fails the parser, and warns once", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    const count = b.signal('count', 0, (raw) => {
      if (typeof raw !== 'number') throw new Error('not a number')
      return raw
    })
    // A peer writing through a different parser — or a hand-rolled socket — can send anything.
    a.signal('count', 'x', parseString).set('not a number')
    await settle()
    expect(count.value).toBe(0)
    void count.value
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('shares presence and clears it when someone leaves', async () => {
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    // Joining is enough to be present, before any value is set.
    expect(Object.values(b.presence.value)).toEqual([{}])
    expect(Object.values(a.presence.value)).toEqual([{}])

    a.setPresence({ x: 10, y: 20 })
    await settle()
    expect(Object.values(b.presence.value)).toEqual([{ x: 10, y: 20 }])

    a.setPresence(null) // clears the value, but A is still here
    await settle()
    expect(Object.values(b.presence.value)).toEqual([{}])

    a.close()
    await settle()
    expect(b.presence.value).toEqual({})
  })

  it('sends writes made while disconnected once it reconnects', async () => {
    const hub = createHub()
    const a = join(hub)
    const b = join(hub)
    await settle()
    const title = a.signal('title', '', parseString)

    hub.clients[0]!.close() // the network drops A's socket
    title.set('offline edit')
    expect(title.value).toBe('offline edit') // still applied locally
    await settle()

    expect(a.status.value).toBe('open') // reconnected on its own
    expect(hub.clients).toHaveLength(3)
    expect(b.signal('title', '', parseString).value).toBe('offline edit')
  })
})

describe('SyncRoom validation', () => {
  function rawSocket(hub: ReturnType<typeof createHub>) {
    const received: string[] = []
    const socket: HibernatableWebSocket & { attachment?: unknown } = {
      send: (m) => void received.push(m),
      close: () => undefined,
      serializeAttachment(v) {
        this.attachment = v
      },
      deserializeAttachment() {
        return this.attachment
      },
    }
    return { socket, received, hub }
  }

  it.each([
    ['not JSON', '{nope'],
    ['an unknown type', '{"t":"drop"}'],
    ['a bad path', '{"t":"set","id":"1","path":"../etc","value":1}'],
    ['a missing id', '{"t":"set","path":"a","value":1}'],
    [
      'an oversized value',
      JSON.stringify({ t: 'set', id: '1', path: 'a', value: 'x'.repeat(70_000) }),
    ],
  ])('rejects %s with an error message and stores nothing', async (_name, message) => {
    const hub = createHub()
    const { socket, received } = rawSocket(hub)
    await hub.room.accept(socket)
    await hub.room.webSocketMessage(socket, message)
    expect(JSON.parse(received.at(-1)!).t).toBe('error')
    expect([...hub.storage.keys()]).toEqual([])
  })
})

describe('paths', () => {
  it('refuses an ambiguous path on the client before sending it', async () => {
    const hub = createHub()
    const a = join(hub)
    await settle()
    expect(() => a.signal('x/../y', '', parseString).set('v')).toThrow('Invalid room path')
    expect(() => a.map('notes', parseNote).set('', { text: 'v' })).toThrow('Invalid room path')
  })
})

describe('roomResponse', () => {
  const upgrade = new Request('http://x/api/rooms/demo', { headers: { upgrade: 'websocket' } })
  const namespace = {
    idFromName: (name: string) => `id:${name}`,
    get: vi.fn((id: string) => ({ fetch: async () => new Response(id) })),
  }

  it('forwards a WebSocket upgrade to the room with that name', async () => {
    const response = await roomResponse(upgrade, namespace, 'demo')
    expect(await response.text()).toBe('id:demo')
  })

  it('refuses a bad room name and a non-upgrade request', async () => {
    expect((await roomResponse(upgrade, namespace, '../x')).status).toBe(400)
    expect(
      (await roomResponse(new Request('http://x/api/rooms/demo'), namespace, 'demo')).status,
    ).toBe(426)
  })
})
