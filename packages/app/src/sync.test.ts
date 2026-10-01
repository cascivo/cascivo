import { memoryDriver } from '@cascivo/core'
import type { StorageDriver } from '@cascivo/core'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineJob, watchJob } from './jobs'
import { jobReporter } from './jobs-server'
import { defineLive, watchLive } from './live'
import { LiveRoom, recordLive } from './live-server'
import { connectRoom, parseSnapshot } from './sync'
import type { Room } from './sync'
import { roomResponse, SyncRoom, writeRoom } from './sync-server'
import type {
  ClientWrite,
  HibernatableWebSocket,
  Json,
  RoomWrite,
  SyncRoomState,
} from './sync-server'

/** An in-memory Durable Object host: one SyncRoom, real storage semantics, async delivery. */
function createHub(make: (ctx: SyncRoomState) => SyncRoom = (ctx) => new SyncRoom(ctx)) {
  const storage = new Map<string, unknown>()
  const open: ServerSocket[] = []
  const ctx: SyncRoomState = {
    id: { name: 'demo' },
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
  const room = make(ctx)
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
      const { readOnly, claims } = hub
      serially(async () => {
        this.readyState = 1
        await room.accept(this.server, { readOnly, ...(claims === undefined ? {} : { claims }) })
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

  const hub = {
    room,
    storage,
    clients,
    /** Whether the next socket to join is read-only, as `roomResponse(…, { readOnly })` makes it. */
    readOnly: false,
    /** The claims the next socket joins with, as `roomResponse(…, { claims })` sets them. */
    claims: undefined as Json | undefined,
    FakeClient: FakeClient as unknown as new (url: string) => WebSocket,
    /** A Durable Object namespace with this one room behind every name. */
    namespace: {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: (request: Request) => {
          let response!: Response
          return serially(async () => {
            response = await room.fetch(request)
          }).then(() => response)
        },
      }),
    },
  }
  return hub
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

/** A socket that never connects: the device is offline. */
class OfflineSocket {
  readyState = 0
  addEventListener() {}
  send() {}
  close() {}
}
const Offline = OfflineSocket as unknown as new (url: string) => WebSocket

describe('connectRoom with storage (local-first)', () => {
  function local(storage: StorageDriver, Socket: new (url: string) => WebSocket): Room {
    const room = connectRoom('ws://test/room', {
      WebSocket: Socket,
      storage,
      minReconnectMs: 1,
      maxReconnectMs: 1,
    })
    rooms.push(room)
    return room
  }

  it('keeps offline writes across a reload and sends them on the next connection', async () => {
    const hub = createHub()
    const storage = memoryDriver()

    const first = local(storage, Offline)
    first.map('notes', parseNote).set('a', { text: 'written offline' })
    expect(first.unsynced.value).toBe(1)
    await settle()
    first.close()

    // A reload, still offline: the write is there before any socket opens.
    const second = local(storage, Offline)
    expect(second.map('notes', parseNote).value).toEqual({ a: { text: 'written offline' } })
    expect(second.unsynced.value).toBe(1)
    second.close()

    // Back online: it reaches the room and is no longer pending.
    const third = local(storage, hub.FakeClient)
    await settle()
    expect(hub.storage.get('v:notes/a')).toEqual({ text: 'written offline' })
    expect(third.unsynced.value).toBe(0)
    const saved = parseSnapshot(storage.get('cascivo-room:ws://test/room') as string)
    expect(saved?.pending).toEqual([])
    expect(saved?.confirmed['notes/a']).toEqual({ text: 'written offline' })
  })

  it('renders the last state it saw before the socket opens', async () => {
    const hub = createHub()
    const storage = memoryDriver()
    const online = local(storage, hub.FakeClient)
    await settle()
    online.signal('title', '', parseString).set('Roadmap')
    await settle()
    online.close()

    const offline = local(storage, Offline)
    expect(offline.signal('title', '', parseString).value).toBe('Roadmap')
    expect(offline.status.value).toBe('connecting')
  })

  it('lets the room win over a stale saved copy once it connects', async () => {
    const hub = createHub()
    const storage = memoryDriver()
    storage.set(
      'cascivo-room:ws://test/room',
      JSON.stringify({ v: 1, confirmed: { title: 'stale' }, pending: [] }),
    )
    hub.storage.set('v:title', 'current')
    const room = local(storage, hub.FakeClient)
    expect(room.signal('title', '', parseString).value).toBe('stale')
    await settle()
    expect(room.signal('title', '', parseString).value).toBe('current')
  })

  it('waits for an async driver before connecting', async () => {
    const hub = createHub()
    let release: (raw: string | null) => void = () => {}
    const storage: StorageDriver = {
      get: () => new Promise((resolve) => (release = resolve)),
      set: () => {},
      remove: () => {},
    }
    const room = local(storage, hub.FakeClient)
    await settle()
    expect(hub.clients).toHaveLength(0)
    release(JSON.stringify({ v: 1, confirmed: {}, pending: [{ path: 'title', value: 'queued' }] }))
    await settle()
    expect(hub.clients).toHaveLength(1)
    expect(hub.storage.get('v:title')).toBe('queued')
    expect(room.unsynced.value).toBe(0)
  })

  it('ignores an unreadable saved copy, with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = memoryDriver()
    storage.set('cascivo-room:ws://test/room', '{"v":1,"confirmed":')
    const room = local(storage, Offline)
    expect(room.signal('title', 'none', parseString).value).toBe('none')
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('parseSnapshot', () => {
  it('drops entries with invalid paths or shapes, keeping the rest', () => {
    const raw = JSON.stringify({
      v: 1,
      confirmed: { ok: 1, '../etc': 2 },
      pending: [{ path: 'ok', value: 3 }, { path: '..', value: 4 }, 'junk', { path: 'x' }],
    })
    expect(parseSnapshot(raw)).toEqual({
      v: 1,
      confirmed: { ok: 1 },
      pending: [{ path: 'ok', value: 3 }],
    })
  })

  it('refuses another version or a non-object', () => {
    expect(parseSnapshot(JSON.stringify({ v: 2, confirmed: {}, pending: [] }))).toBeNull()
    expect(parseSnapshot('[]')).toBeNull()
    expect(parseSnapshot('not json')).toBeNull()
  })
})

describe('write limits', () => {
  it('refuses a value the room would reject, so it never sits in the queue forever', () => {
    const room = connectRoom('ws://test/room', { WebSocket: Offline })
    rooms.push(room)
    expect(() => room.signal('big', '', parseString).set('x'.repeat(70_000))).toThrow(/over/)
    expect(room.unsynced.value).toBe(0)
  })
})

describe('SyncRoom.onWrite', () => {
  it('receives each stored write with the room name, and a failing hook does not stop the room', async () => {
    const seen: RoomWrite[] = []
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    class MirroredRoom extends SyncRoom {
      protected override onWrite(write: RoomWrite) {
        seen.push(write)
        if (write.path === 'boom') throw new Error('mirror down')
      }
    }
    const hub = createHub((ctx) => new MirroredRoom(ctx))
    const a = join(hub)
    const b = join(hub)
    await settle()
    a.signal('title', '', parseString).set('Roadmap')
    a.signal('boom', '', parseString).set('x')
    await settle()
    expect(seen).toEqual([
      { room: 'demo', path: 'title', value: 'Roadmap' },
      { room: 'demo', path: 'boom', value: 'x' },
    ])
    expect(b.signal('boom', '', parseString).value).toBe('x')
    expect(error).toHaveBeenCalledOnce()
  })
})

describe('writeRoom and read-only rooms', () => {
  it('delivers a write from the Worker to everyone in the room', async () => {
    const hub = createHub()
    const room = join(hub)
    await settle()
    await writeRoom(hub.namespace, 'demo', 'title', 'From the server')
    await settle()
    expect(room.signal('title', '', parseString).value).toBe('From the server')
    expect(hub.storage.get('v:title')).toBe('From the server')
  })

  it('checks a server write like any other', async () => {
    const hub = createHub()
    await expect(writeRoom(hub.namespace, 'demo', '../x', 1)).rejects.toThrow(/Invalid room path/)
    await expect(writeRoom(hub.namespace, 'bad name!', 'x', 1)).rejects.toThrow(/room name/)
    const response = await hub.room.fetch(
      new Request('https://room.internal/write', {
        method: 'POST',
        headers: { 'x-cascivo-room-write': '1' },
        body: JSON.stringify({ path: 'x' }),
      }),
    )
    expect(response.status).toBe(400)
  })

  it('refuses writes from a read-only socket but still sends it every change', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hub = createHub()
    hub.readOnly = true
    const watcher = join(hub)
    await settle()
    watcher.signal('title', '', parseString).set('forged')
    await settle()
    expect(hub.storage.has('v:title')).toBe(false)
    expect(warn.mock.calls.join(' ')).toContain('read-only')
    // The refused write is dropped on the client too, so it is not resent or shown.
    expect(watcher.unsynced.value).toBe(0)
    expect(watcher.signal('title', '', parseString).value).toBe('')
    await writeRoom(hub.namespace, 'demo', 'title', 'real')
    await settle()
    expect(watcher.signal('title', '', parseString).value).toBe('real')
  })

  it('roomResponse marks a read-only connection and strips a forged marker', async () => {
    const seen: Headers[] = []
    const ns = {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: async (request: Request) => {
          seen.push(request.headers)
          return new Response(null, { status: 204 })
        },
      }),
    }
    const upgrade = (extra: Record<string, string> = {}) =>
      new Request('http://x/api/jobs/1', { headers: { upgrade: 'websocket', ...extra } })
    await roomResponse(upgrade({ 'x-cascivo-room-write': '1' }), ns, 'job-1', { readOnly: true })
    await roomResponse(upgrade({ 'x-cascivo-room-read-only': '1' }), ns, 'room-1')
    expect(seen[0]!.get('x-cascivo-room-read-only')).toBe('1')
    expect(seen[0]!.get('x-cascivo-room-write')).toBeNull()
    expect(seen[1]!.get('x-cascivo-room-read-only')).toBeNull()
  })
})

describe('SyncRoom.canWrite', () => {
  /** Notes are open to everyone; the title only to a connection the Worker marked as host. */
  class RuledRoom extends SyncRoom {
    seen: ClientWrite[] = []
    protected override canWrite(write: ClientWrite) {
      this.seen.push(write)
      if (write.path.startsWith('notes/')) return true
      if (write.path === 'boom') throw new Error('rule crashed')
      const { claims } = write.connection
      const host =
        typeof claims === 'object' && claims !== null && 'role' in claims && claims.role === 'host'
      return host || 'Only the host can rename the room'
    }
  }

  it('stores what the rule accepts and refuses the rest, back to the writer only', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hub = createHub((ctx) => new RuledRoom(ctx))
    const guest = join(hub)
    const other = join(hub)
    await settle()
    guest.map('notes', parseNote).set('a', { text: 'hi' })
    guest.signal('title', '', parseString).set('forged')
    await settle()
    expect(hub.storage.get('v:notes/a')).toEqual({ text: 'hi' })
    expect(hub.storage.has('v:title')).toBe(false)
    expect(other.signal('title', '', parseString).value).toBe('')
    // The writer drops the refused write instead of resending it forever.
    expect(guest.unsynced.value).toBe(0)
    expect(guest.signal('title', '', parseString).value).toBe('')
    expect(warn.mock.calls.join(' ')).toContain('Only the host can rename the room')
  })

  it('passes the claims the Worker set, and null when it set none', async () => {
    const hub = createHub((ctx) => new RuledRoom(ctx))
    hub.claims = { role: 'host' }
    const host = join(hub)
    await settle()
    host.signal('title', '', parseString).set('Roadmap')
    await settle()
    expect(hub.storage.get('v:title')).toBe('Roadmap')
    hub.claims = undefined
    const guest = join(hub)
    await settle()
    guest.map('notes', parseNote).set('b', { text: 'x' })
    await settle()
    const room = hub.room as RuledRoom
    expect(room.seen.map((w) => w.connection.claims)).toEqual([{ role: 'host' }, null])
    expect(room.seen[0]).toMatchObject({ room: 'demo', path: 'title', value: 'Roadmap' })
  })

  it('refuses a write whose rule throws, and logs it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const hub = createHub((ctx) => new RuledRoom(ctx))
    const room = join(hub)
    await settle()
    room.signal('boom', 0, (raw) => Number(raw)).set(1)
    await settle()
    expect(hub.storage.has('v:boom')).toBe(false)
    expect(error.mock.calls.join(' ')).toContain('canWrite failed')
  })

  it('does not apply to writes from the Worker', async () => {
    const hub = createHub((ctx) => new RuledRoom(ctx))
    await writeRoom(hub.namespace, 'demo', 'title', 'From the server')
    expect(hub.storage.get('v:title')).toBe('From the server')
  })

  it('reads claims from the upgrade request into the connection, ignoring malformed ones', async () => {
    class Socket implements HibernatableWebSocket {
      attachment: unknown
      send() {}
      close() {}
      serializeAttachment(value: unknown) {
        this.attachment = value
      }
      deserializeAttachment() {
        return this.attachment
      }
    }
    const sockets: Socket[] = []
    vi.stubGlobal(
      'WebSocketPair',
      class {
        constructor() {
          const server = new Socket()
          sockets.push(server)
          return [{}, server]
        }
      },
    )
    // Node's Response refuses status 101; the room's answer is not under test here.
    vi.stubGlobal(
      'Response',
      class {
        constructor(
          _body: unknown,
          readonly init: ResponseInit,
        ) {}
      },
    )
    const hub = createHub()
    const upgrade = (claims?: string) =>
      new Request('https://room.internal/', {
        headers: { upgrade: 'websocket', ...(claims ? { 'x-cascivo-room-claims': claims } : {}) },
      })
    await hub.room.fetch(upgrade('{"role":"host"}'))
    await hub.room.fetch(upgrade('{not json'))
    vi.unstubAllGlobals()
    expect(sockets.map((s) => (s.attachment as { claims?: unknown }).claims)).toEqual([
      { role: 'host' },
      undefined,
    ])
  })

  it('roomResponse sends claims as JSON, strips forged ones and refuses oversized ones', async () => {
    const seen: Headers[] = []
    const ns = {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: async (request: Request) => {
          seen.push(request.headers)
          return new Response(null, { status: 204 })
        },
      }),
    }
    const upgrade = (extra: Record<string, string> = {}) =>
      new Request('http://x/api/rooms/a', { headers: { upgrade: 'websocket', ...extra } })
    await roomResponse(upgrade(), ns, 'a', { claims: { role: 'host', user: 'u1' } })
    await roomResponse(upgrade({ 'x-cascivo-room-claims': '{"role":"host"}' }), ns, 'a')
    expect(JSON.parse(seen[0]!.get('x-cascivo-room-claims')!)).toEqual({ role: 'host', user: 'u1' })
    expect(seen[1]!.get('x-cascivo-room-claims')).toBeNull()
    expect(() => roomResponse(upgrade(), ns, 'a', { claims: 'x'.repeat(5000) })).toThrow(/4096/)
  })
})

describe('jobs', () => {
  const parseSummary = (raw: unknown): { imported: number } => {
    if (
      typeof raw === 'object' &&
      raw !== null &&
      'imported' in raw &&
      typeof raw.imported === 'number'
    ) {
      return { imported: raw.imported }
    }
    throw new Error('not a summary')
  }
  const importJob = defineJob({ steps: ['Read', 'Check', 'Import'], output: parseSummary })

  it('streams a job from queued to done to everyone watching', async () => {
    const hub = createHub()
    const job = watchJob(importJob, 'ws://test/job', { WebSocket: hub.FakeClient })
    await settle()
    expect(job.state.value).toEqual(importJob.initial)

    const report = jobReporter(importJob, hub.namespace, 'abc')
    await report.step(1, 'Checking rows')
    await settle()
    expect(job.state.value).toMatchObject({ status: 'running', step: 1, message: 'Checking rows' })

    await report.progress(2, 0.5, 'Imported 5 of 10')
    await settle()
    expect(job.state.value).toMatchObject({ step: 2, progress: 0.5 })

    await report.done({ imported: 10 })
    await settle()
    expect(job.state.value).toMatchObject({ status: 'done', step: 2, output: { imported: 10 } })

    // Someone opening the job later sees where it is.
    const late = watchJob(importJob, 'ws://test/job', { WebSocket: hub.FakeClient })
    await settle()
    expect(late.state.value.status).toBe('done')
    job.close()
    late.close()
  })

  it('reports a failure at the step it happened', async () => {
    const hub = createHub()
    const job = watchJob(importJob, 'ws://test/job', { WebSocket: hub.FakeClient })
    const report = jobReporter(importJob, hub.namespace, 'abc')
    await report.step(1)
    await report.fail(new Error('Row 3 has no email'))
    await settle()
    expect(job.state.value).toMatchObject({
      status: 'failed',
      step: 1,
      error: 'Row 3 has no email',
    })
    job.close()
  })

  it('ignores a state whose output fails the parser', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hub = createHub()
    const job = watchJob(importJob, 'ws://test/job', { WebSocket: hub.FakeClient })
    await jobReporter(importJob, hub.namespace, 'abc').step(2)
    await writeRoom(hub.namespace, 'demo', 'state', { status: 'done', step: 2, output: 'lies' })
    await settle()
    // The forged "done" never shows: the state falls back to the job's initial state.
    expect(job.state.value).toEqual(importJob.initial)
    job.close()
  })

  it('refuses a step out of range and a job id that cannot be a room', () => {
    const hub = createHub()
    expect(() => jobReporter(importJob, hub.namespace, 'abc').step(3)).toThrow(/out of range/)
    expect(() => importJob.roomName('../x')).toThrow(/Job ids/)
    expect(() => defineJob({ steps: [], output: parseSummary })).toThrow(/at least one step/)
  })
})

describe('live dashboards', () => {
  const ops = defineLive({ metrics: ['orders', 'errors'], window: 10 })
  const liveHub = () => createHub((ctx) => new LiveRoom(ctx))
  const second = (at: number) => Math.floor(at / 1000) * 1000

  it('checks definitions and events', () => {
    expect(() => defineLive({ metrics: [] })).toThrow(/at least one metric/)
    expect(() => defineLive({ metrics: ['a b'] })).toThrow(/Metric names/)
    expect(() => defineLive({ metrics: ['a'], window: 7200 })).toThrow(/window/)
    expect(ops.parseEvent({ values: { orders: 2 } })).toEqual({ values: { orders: 2 } })
    expect(() => ops.parseEvent({ values: { refunds: 1 } })).toThrow(/Unknown metric/)
    expect(() => ops.parseEvent({ values: { orders: Number.NaN } })).toThrow(/not a number/)
    expect(() => ops.parseEvent({ at: '5', values: {} })).toThrow(/time in ms/)
    expect(() => ops.parseEvents(Array.from({ length: 101 }, () => ({ values: {} })))).toThrow(
      /At most 100/,
    )
  })

  it('fills the window with zeros where no event fell', () => {
    const now = 1_000_000_500
    const points = ops.points({ '999999': { orders: 3, errors: 1 } }, now)
    expect(points).toHaveLength(10)
    expect(points[0]!.at).toBe(999_991_000)
    expect(points.at(-1)).toEqual({ at: 1_000_000_000, values: { orders: 0, errors: 0 } })
    expect(points.at(-2)).toEqual({ at: 999_999_000, values: { orders: 3, errors: 1 } })
  })

  it('adds batches into per-second totals that every viewer sees, late joiners included', async () => {
    // watchLive reads the clock when it starts and then once a second. On the real clock a
    // second boundary could fall between that read and the events below, and the viewer's
    // window would end one second before their bucket (CI failure on main, 0f22941c). Only
    // Date is pinned, mid-second: the hub still delivers on real timers.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_700_000_000_500)
    onTestFinished(() => {
      vi.useRealTimers()
    })
    const hub = liveHub()
    const viewer = watchLive(ops, 'ws://test/live', { WebSocket: hub.FakeClient })
    await settle()
    const at = Date.now()
    await recordLive(ops, hub.namespace, 'ops', [
      { at, values: { orders: 1 } },
      { at, values: { orders: 2, errors: 1 } },
    ])
    await recordLive(ops, hub.namespace, 'ops', [{ at, values: { orders: 4 } }])
    await settle()
    const bucket = viewer.points.value.find((p) => p.at === second(at))
    expect(bucket?.values).toEqual({ orders: 7, errors: 1 })

    const late = watchLive(ops, 'ws://test/live', { WebSocket: hub.FakeClient })
    await settle()
    expect(late.points.value.find((p) => p.at === second(at))?.values.orders).toBe(7)
    viewer.close()
    late.close()
  })

  it('drops events outside the window and malformed ones, and trims old buckets', async () => {
    // An event without `at` is stamped when recorded; pinned, so that stamp cannot fall in the
    // second after `now` and name a different bucket.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_700_000_000_500)
    onTestFinished(() => {
      vi.useRealTimers()
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hub = liveHub()
    const now = Date.now()
    await recordLive(ops, hub.namespace, 'ops', [
      { at: now - 60_000, values: { orders: 1 } },
      { values: { refunds: 1 } },
      { values: { orders: 1 } },
    ])
    expect([...hub.storage.keys()]).toEqual([`v:b/${second(now) / 1000}`])
    expect(warn.mock.calls.join(' ')).toContain('Unknown metric')
    // A minute later the bucket has left the window, and the next record removes it.
    const room = hub.room as LiveRoom
    await room.record({ window: 10, bucket: 1, events: [] }, now + 60_000)
    expect(hub.storage.size).toBe(0)
  })

  it('cannot be written through roomResponse', async () => {
    const seen: Headers[] = []
    const ns = {
      idFromName: (name: string) => name,
      get: () => ({
        fetch: async (request: Request) => {
          seen.push(request.headers)
          return new Response(null, { status: 204 })
        },
      }),
    }
    await roomResponse(
      new Request('http://x/api/live', {
        method: 'POST',
        headers: { upgrade: 'websocket', 'x-cascivo-room-live-record': '1' },
      }),
      ns,
      'ops',
      { readOnly: true },
    )
    expect(seen[0]!.get('x-cascivo-room-live-record')).toBeNull()
    await expect(recordLive(ops, ns, '../ops', [{ values: {} }])).rejects.toThrow(/room name/)
  })
})
