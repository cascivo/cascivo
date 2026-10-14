import { createClient } from '@cascivo/app/api'
import type { TableQuery } from '@cascivo/app/db'
import { signal } from '@cascivo/react'
import { api } from './api'
import type { Customer, CustomerInput, Plan } from './customers'

const client = createClient(api)

export const PAGE_SIZE = 10

/** The current page, as the Worker returned it for `query`. */
export const rows = signal<Customer[]>([])
export const total = signal(0)
export const loadError = signal<string | null>(null)

/** The plan filter above the table; '' is every plan. */
export const plan = signal<Plan | ''>('')

let query: TableQuery = { sort: undefined, search: '', filters: {}, page: 1, pageSize: PAGE_SIZE }
let latest = 0

/** Fetches the page for `next` (or the current query again); a slower, older answer is dropped. */
export async function load(next: TableQuery = query): Promise<void> {
  query = next
  const request = ++latest
  const filters = plan.value
    ? { ...next.filters, plan: { kind: 'select' as const, values: [plan.value] } }
    : next.filters
  try {
    const page = await client.customers({ body: { ...next, filters } })
    if (request !== latest) return
    rows.value = page.rows
    total.value = page.total
    loadError.value = null
  } catch (error) {
    if (request === latest)
      loadError.value = error instanceof Error ? error.message : 'Could not load'
  }
}

export function setPlan(next: Plan | ''): void {
  plan.value = next
  void load({ ...query, page: 1 })
}

export async function save(id: string | null, input: CustomerInput): Promise<void> {
  if (id) await client.updateCustomer({ params: { id }, body: input })
  else await client.createCustomer({ body: input })
  await load()
}

export async function remove(id: string): Promise<void> {
  await client.deleteCustomer({ params: { id } })
  await load()
}
