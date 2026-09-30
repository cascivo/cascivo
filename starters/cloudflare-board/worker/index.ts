import { createHandler } from '@cascivo/app/api'
import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'

// The Durable Object class behind every room. wrangler.jsonc binds it as ROOMS, and it must be
// exported from the Worker's main module.
export { SyncRoom } from '@cascivo/app/sync-server'

/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as `env`.
 */
export interface Env {
  ROOMS: RoomNamespace<unknown>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * One handler per endpoint in src/api.ts, typed from it. A stream handler is an async
 * generator: each `yield` is one server-sent event, and returning ends the stream. When the
 * client disconnects, `signal` aborts.
 */
const handleApi = createHandler<typeof api, Env>(api, {
  ticks: async function* ({ signal }) {
    for (let n = 1; n <= TICKS_PER_STREAM && !signal.aborted; n++) {
      const tick: Tick = { n, at: new Date().toISOString() }
      yield tick
      await sleep(1000)
    }
  },
})

// wrangler.jsonc routes only /api/* here; everything else is a static asset or index.html.
export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const room = /^\/api\/rooms\/([^/]+)$/.exec(new URL(request.url).pathname)
    if (room) return roomResponse(request, env.ROOMS, room[1]!)
    return handleApi(request, env)
  },
}
