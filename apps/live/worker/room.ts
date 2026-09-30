import { SyncRoom } from '@cascivo/app/sync-server'
import type { HibernatableWebSocket } from '@cascivo/app/sync-server'

/**
 * The landing page's room. Anyone on cascivo.com can join, so it accepts exactly one thing
 * from a browser: where that visitor's pointer is. No text, no stored values — nothing a
 * visitor sends can put words or images in front of the next one.
 */
export const ROOM_LIMITS = {
  /** Sockets per room. Beyond it a visitor is turned away, and the page says the room is full. */
  maxSockets: 100,
  /** Pointer updates per socket per second; the page sends ten, the rest are dropped. */
  messagesPerSecond: 20,
} as const

export interface Cursor {
  /** Fractions of the strip's width and height, 0–1, so every screen size maps onto every other. */
  x: number
  y: number
}

const fraction = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? Math.round(value * 1000) / 1000
    : null

/**
 * A pointer update as `@cascivo/app/sync` sends it: `{ t: 'presence', value }`, where `value`
 * is a cursor or `null` (the pointer left). Returns `undefined` for anything else, which the
 * room drops without answering.
 */
export function parseCursorMessage(raw: string | ArrayBuffer): Cursor | null | undefined {
  if (typeof raw !== 'string' || raw.length > 200) return undefined
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof data !== 'object' || data === null) return undefined
  const { t, value } = data as Record<string, unknown>
  if (t !== 'presence') return undefined
  if (value === null) return null
  if (typeof value !== 'object') return undefined
  const x = fraction((value as Record<string, unknown>)['x'])
  const y = fraction((value as Record<string, unknown>)['y'])
  return x === null || y === null ? undefined : { x, y }
}

export class LandingRoom extends SyncRoom {
  /** Per-socket message counts for the current second. Lost on hibernation, which only resets them. */
  private readonly rates = new WeakMap<HibernatableWebSocket, { second: number; count: number }>()

  override async fetch(request: Request): Promise<Response> {
    if (this.ctx.getWebSockets().length >= ROOM_LIMITS.maxSockets) {
      return new Response('The room is full', { status: 503 })
    }
    return super.fetch(request)
  }

  override async webSocketMessage(
    socket: HibernatableWebSocket,
    raw: string | ArrayBuffer,
  ): Promise<void> {
    const cursor = parseCursorMessage(raw)
    if (cursor === undefined || !this.allow(socket)) return
    // Re-serialized from the parsed cursor, so only these two rounded numbers are relayed.
    await super.webSocketMessage(socket, JSON.stringify({ t: 'presence', value: cursor }))
  }

  private allow(socket: HibernatableWebSocket): boolean {
    const second = Math.floor(Date.now() / 1000)
    const rate = this.rates.get(socket)
    if (!rate || rate.second !== second) {
      this.rates.set(socket, { second, count: 1 })
      return true
    }
    rate.count += 1
    return rate.count <= ROOM_LIMITS.messagesPerSecond
  }
}
