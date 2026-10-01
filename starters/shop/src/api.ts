import { defineApi, endpoint, stream } from '@cascivo/app/api'
import { parseCheckoutStarted, parseOrder } from './checkout'

/**
 * The contract between the browser and the Worker. Both import this file: the Worker serves
 * it with `createHandler`, the app calls it with `createClient`, and a change that breaks
 * either side is a type error. Add an endpoint here, then its handler in worker/index.ts.
 */

/** How many ticks one stream sends before it ends. */
export const TICKS_PER_STREAM = 30

export interface Tick {
  n: number
  /** ISO timestamp, set by the Worker. */
  at: string
}

/**
 * Parses one streamed tick. It crosses the network, so it is checked rather than cast —
 * `JSON.parse` returns `any`, and `as Tick` would prove nothing.
 */
export function parseTick(raw: unknown): Tick {
  if (typeof raw === 'object' && raw !== null) {
    const { n, at } = raw as Record<string, unknown>
    if (typeof n === 'number' && typeof at === 'string') return { n, at }
  }
  throw new Error('Malformed tick')
}

export const api = defineApi({
  ticks: stream({ method: 'GET', path: '/api/ticks', event: parseTick }),
  // Opens a Stripe Checkout page for the product; the browser goes to its url.
  startCheckout: endpoint({ method: 'POST', path: '/api/checkout', output: parseCheckoutStarted }),
  // An order, checked with Stripe while it is pending (Stripe's webhook settles it too).
  getOrder: endpoint({ method: 'GET', path: '/api/orders/:id', output: parseOrder }),
})
