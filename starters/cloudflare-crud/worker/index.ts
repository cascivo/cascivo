import type { Database } from '@cascivo/app/db'
import { createHandler } from '@cascivo/app/api'
import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'
import * as customerStore from './customers'

/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as `env`.
 */
export interface Env {
  DB: Database
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
  customers: ({ body, env }) => customerStore.listCustomers(env.DB, body),
  createCustomer: ({ body, env }) => customerStore.createCustomer(env.DB, body),
  updateCustomer: ({ params, body, env }) => customerStore.updateCustomer(env.DB, params.id, body),
  deleteCustomer: ({ params, env }) => customerStore.deleteCustomer(env.DB, params.id),
})

// wrangler.jsonc routes only /api/* here; everything else is a static asset or index.html.
export default {
  fetch: handleApi,
}
