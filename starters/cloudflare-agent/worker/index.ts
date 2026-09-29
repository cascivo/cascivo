import { createHandler } from '@cascivo/app/api'
import { routeAgentRequest } from 'agents'
import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'

// The Durable Object behind /assistant: one per conversation (worker/assistant.ts).
export { Assistant } from './assistant'

/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as `env`.
 */
export interface Env {
  /** Workers AI, bound in wrangler.jsonc. */
  AI: Ai
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

// wrangler.jsonc routes only /api/* and /agents/* here; everything else is a static asset or index.html.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // /agents/assistant/<conversation>: the WebSocket useAgent() opens.
    const agent = await routeAgentRequest(request, env)
    if (agent) return agent
    return handleApi(request, env)
  },
}
