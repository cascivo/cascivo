// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import worker, { isAllowedOrigin } from './index'
import type { Env } from './index'
import { LandingRoom, parseCursorMessage, ROOM_LIMITS } from './room'
import type { HibernatableWebSocket, SyncRoomState } from '@cascivo/app/sync-server'

class Socket implements HibernatableWebSocket {
  sent: unknown[] = []
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
  const ctx: SyncRoomState = {
    id: { name: 'landing' },
    acceptWebSocket: (socket) => open.push(socket as Socket),
    getWebSockets: () => [...open],
    storage: {
      get: async () => undefined,
      put: async () => {},
      delete: async () => false,
      list: async () => new Map() as never,
    },
  }
  const room = new LandingRoom(ctx)
  const join = async () => {
    const socket = new Socket()
    await room.accept(socket, { readOnly: true })
    return socket
  }
  return { room, open, join }
}

const presence = (value: unknown) => JSON.stringify({ t: 'presence', value })

describe('parseCursorMessage', () => {
  it('accepts a pointer as two fractions, rounded, or null', () => {
    expect(parseCursorMessage(presence({ x: 0.123456, y: 1 }))).toEqual({ x: 0.123, y: 1 })
    expect(parseCursorMessage(presence(null))).toBeNull()
  })

  it('drops everything else', () => {
    for (const raw of [
      presence({ x: 2, y: 0 }),
      presence({ x: -0.1, y: 0 }),
      presence({ x: '0.5', y: 0.5 }),
      presence({ name: 'hello' }),
      presence('text'),
      JSON.stringify({ t: 'set', id: '1', path: 'a', value: 1 }),
      presence({ x: 0.5, y: 0.5, note: 'x'.repeat(200) }),
      'not json',
      new ArrayBuffer(4),
    ]) {
      expect(parseCursorMessage(raw)).toBeUndefined()
    }
  })
})

describe('LandingRoom', () => {
  it('relays only the parsed cursor to the others', async () => {
    const { room, join } = createRoom()
    const a = await join()
    const b = await join()
    b.sent = []
    await room.webSocketMessage(a, presence({ x: 0.5, y: 0.25, name: 'not relayed' }))
    expect(b.sent).toEqual([
      { t: 'presence', conn: expect.any(String), value: { x: 0.5, y: 0.25 } },
    ])
  })

  it('never answers a write', async () => {
    const { room, join } = createRoom()
    const a = await join()
    const b = await join()
    a.sent = []
    b.sent = []
    await room.webSocketMessage(a, JSON.stringify({ t: 'set', id: '1', path: 'x', value: 'hi' }))
    expect([...a.sent, ...b.sent]).toEqual([])
  })

  it('drops updates past the per-second limit', async () => {
    vi.useFakeTimers({ now: 1_000_000 })
    try {
      const { room, join } = createRoom()
      const a = await join()
      const b = await join()
      b.sent = []
      for (let i = 0; i < ROOM_LIMITS.messagesPerSecond + 5; i++) {
        await room.webSocketMessage(a, presence({ x: 0, y: 0 }))
      }
      expect(b.sent).toHaveLength(ROOM_LIMITS.messagesPerSecond)
      vi.advanceTimersByTime(1000)
      await room.webSocketMessage(a, presence({ x: 0, y: 0 }))
      expect(b.sent).toHaveLength(ROOM_LIMITS.messagesPerSecond + 1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('turns a visitor away once the room is full', async () => {
    const { room, join } = createRoom()
    for (let i = 0; i < ROOM_LIMITS.maxSockets; i++) await join()
    const response = await room.fetch(
      new Request('https://room.internal/', { headers: { upgrade: 'websocket' } }),
    )
    expect(response.status).toBe(503)
  })
})

describe('isAllowedOrigin', () => {
  const allowed = 'https://cascivo.com, https://*.pages.example'
  it('allows listed origins and one subdomain level of a wildcard', () => {
    expect(isAllowedOrigin('https://cascivo.com', allowed)).toBe(true)
    expect(isAllowedOrigin('https://pr-12.pages.example', allowed)).toBe(true)
  })
  it('refuses everything else', () => {
    for (const origin of [
      null,
      'https://evil.example',
      'http://cascivo.com',
      'https://cascivo.com.evil.example',
      'https://a.b.pages.example',
      'https://pages.example',
      'https://evilpages.example',
    ]) {
      expect(isAllowedOrigin(origin, allowed)).toBe(false)
    }
  })
})

describe('the Worker', () => {
  const env = (success = true): Env & { forwarded: Request[] } => {
    const forwarded: Request[] = []
    return {
      forwarded,
      ALLOWED_ORIGINS: 'https://cascivo.com',
      CONNECTS: { limit: async () => ({ success }) },
      ROOMS: {
        idFromName: (name: string) => name,
        get: () => ({
          fetch: async (request: Request) => {
            forwarded.push(request)
            return new Response(null, { status: 204 })
          },
        }),
      },
    }
  }
  const upgrade = (path: string, origin: string) =>
    new Request(`https://live.example${path}`, { headers: { upgrade: 'websocket', origin } })

  it('forwards an allowed page to the one room, read-only', async () => {
    const e = env()
    const response = await worker.fetch(upgrade('/room', 'https://cascivo.com'), e)
    expect(response.status).toBe(204)
    expect(e.forwarded[0]!.headers.get('x-cascivo-room-read-only')).toBe('1')
  })

  it('refuses other paths, other origins and callers over the limit', async () => {
    expect((await worker.fetch(upgrade('/rooms/other', 'https://cascivo.com'), env())).status).toBe(
      404,
    )
    expect((await worker.fetch(upgrade('/room', 'https://evil.example'), env())).status).toBe(403)
    expect((await worker.fetch(upgrade('/room', 'https://cascivo.com'), env(false))).status).toBe(
      429,
    )
  })
})
