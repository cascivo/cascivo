import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'

export { LandingRoom } from './room'

export interface Env {
  ROOMS: RoomNamespace<unknown>
  CONNECTS: { limit(options: { key: string }): Promise<{ success: boolean }> }
  /** Comma-separated origins; `https://*.host` allows one subdomain level of `host`. */
  ALLOWED_ORIGINS: string
}

/**
 * Whether a page on `origin` may open the room. This keeps other sites from embedding it; it
 * is not authentication — a script outside a browser can send any Origin, which is why the
 * room itself accepts nothing but pointer positions.
 */
export function isAllowedOrigin(origin: string | null, allowed: string): boolean {
  if (!origin) return false
  return allowed
    .split(',')
    .map((entry) => entry.trim())
    .some((entry) => {
      const wildcard = /^(https?:\/\/)\*\.(.+)$/.exec(entry)
      if (!wildcard) return entry === origin
      const [, scheme, host] = wildcard
      if (!origin.startsWith(scheme!) || !origin.endsWith(`.${host}`)) return false
      const label = origin.slice(scheme!.length, -host!.length - 1)
      return /^[a-z0-9-]+$/.test(label)
    })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== '/room') {
      return new Response('Not found', { status: 404 })
    }
    if (!isAllowedOrigin(request.headers.get('origin'), env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden origin', { status: 403 })
    }
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
    if (!(await env.CONNECTS.limit({ key: ip })).success) {
      return new Response('Too many connections', { status: 429 })
    }
    // One fixed room, read-only: a browser cannot store a value, only share its pointer.
    return roomResponse(request, env.ROOMS, 'landing', { readOnly: true })
  },
}
