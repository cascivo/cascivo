import { defineApi, endpoint, stream } from '@cascivo/app/api'
import { parseTablePage, parseTableQuery } from '@cascivo/app/db'
import { parseCustomer, parseCustomerInput, parseDeleted } from './customers'

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
  // One page of customers for DataTable's query (sort, search, filters, page).
  customers: endpoint({
    method: 'POST',
    path: '/api/customers/query',
    input: parseTableQuery,
    output: (raw) => parseTablePage(raw, parseCustomer),
  }),
  createCustomer: endpoint({
    method: 'POST',
    path: '/api/customers',
    input: parseCustomerInput,
    output: parseCustomer,
  }),
  updateCustomer: endpoint({
    method: 'PUT',
    path: '/api/customers/:id',
    input: parseCustomerInput,
    output: parseCustomer,
  }),
  deleteCustomer: endpoint({ method: 'DELETE', path: '/api/customers/:id', output: parseDeleted }),
})
