import type { Database } from '@cascivo/app/db'
import { createHandler } from '@cascivo/app/api'
import { clientIp, guardResponse, rateLimit } from '@cascivo/app/guard'
import type { RateLimiter } from '@cascivo/app/guard'
import { roomResponse } from '@cascivo/app/sync-server'
import type { RoomNamespace } from '@cascivo/app/sync-server'
import { api, TICKS_PER_STREAM } from '../src/api'
import type { Tick } from '../src/api'
import * as orderStore from './checkout'
import type { ReceiptSender } from './checkout'
import { ORDER_ID, orderRoom } from '../src/checkout'

// The Durable Object class behind every room. wrangler.jsonc binds it as ROOMS, and it must be
// exported from the Worker's main module.
export { SyncRoom } from '@cascivo/app/sync-server'

/**
 * Add bindings (KV, D1, R2, Durable Objects, Workers AI) in wrangler.jsonc and type them
 * here; every handler receives them as `env`.
 */
export interface Env {
  ROOMS: RoomNamespace<unknown>
  DB: Database
  LIMITER: RateLimiter
  EMAIL: ReceiptSender
  /** The From address of receipts, set in wrangler.jsonc. */
  RECEIPT_FROM: string
  /** Stripe secrets: `wrangler secret put` (.dev.vars locally). Unset until you add them. */
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Requests that each count against LIMITER:
 * - a checkout started (it creates a Stripe session and an order)
 */
function countsAgainstLimit(request: Request): boolean {
  const url = new URL(request.url)
  if (url.pathname === '/api/checkout') return request.method === 'POST'
  return false
}

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
  startCheckout: ({ request, env }) => orderStore.startCheckout(env, new URL(request.url).origin),
  getOrder: ({ params, request, env }) =>
    orderStore.getOrder(env, params.id, new URL(request.url).origin),
})

// wrangler.jsonc routes only /api/* here; everything else is a static asset or index.html.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (countsAgainstLimit(request)) {
      try {
        await rateLimit(env.LIMITER, clientIp(request))
      } catch (error) {
        return guardResponse(error)
      }
    }
    const checkoutPath = new URL(request.url).pathname
    // Stripe's webhook (worker/checkout.ts); a bad signature is a 401.
    if (checkoutPath === orderStore.STRIPE_WEBHOOK_PATH && request.method === 'POST') {
      try {
        return await orderStore.receiveStripe(request, env)
      } catch (error) {
        return guardResponse(error)
      }
    }
    // An order's page watches its room for what Stripe reports: it may watch, never write.
    const orderLive = /^\/api\/orders\/([^/]+)\/live$/.exec(checkoutPath)
    if (orderLive && ORDER_ID.test(orderLive[1]!)) {
      return roomResponse(request, env.ROOMS, orderRoom(orderLive[1]!), { readOnly: true })
    }
    return handleApi(request, env)
  },
}
