import { defineTable } from '@cascivo/app/db'

/**
 * The customers table, shared by the Worker (which queries it) and the page (which shows
 * it). The columns say what the table may sort, search and filter by — anything else in a
 * query is refused before any SQL is built.
 */
export const customersTable = defineTable({
  table: 'customers',
  key: 'id',
  columns: {
    id: {},
    name: { sort: true, search: true, filter: 'text' },
    email: { sort: true, search: true },
    plan: { sort: true, filter: 'select' },
    seats: { sort: true, filter: 'range' },
    created_at: { sort: true },
  },
})

export const PLANS = ['free', 'team', 'enterprise'] as const
export type Plan = (typeof PLANS)[number]

export interface Customer {
  id: string
  name: string
  email: string
  plan: Plan
  seats: number
  created_at: string
}

/** What the form sends: a customer without the fields the Worker sets. */
export type CustomerInput = Omit<Customer, 'id' | 'created_at'>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isPlan(value: unknown): value is Plan {
  return typeof value === 'string' && (PLANS as readonly string[]).includes(value)
}

/** A form submission crosses the network: checked on the Worker before it is stored. */
export function parseCustomerInput(raw: unknown): CustomerInput {
  if (typeof raw !== 'object' || raw === null) throw new Error('Send a customer')
  const { name, email, plan, seats } = raw as Record<string, unknown>
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 120) {
    throw new Error('A name is 1 to 120 characters')
  }
  if (typeof email !== 'string' || !EMAIL.test(email) || email.length > 200) {
    throw new Error('That is not an email address')
  }
  if (!isPlan(plan)) throw new Error(`The plan is one of ${PLANS.join(', ')}`)
  if (typeof seats !== 'number' || !Number.isInteger(seats) || seats < 1 || seats > 100_000) {
    throw new Error('Seats is a whole number from 1')
  }
  return { name: name.trim(), email: email.trim().toLowerCase(), plan, seats }
}

/** A row from D1, or from the Worker's response. */
export function parseCustomer(raw: unknown): Customer {
  if (typeof raw === 'object' && raw !== null) {
    const { id, created_at } = raw as Record<string, unknown>
    if (typeof id === 'string' && typeof created_at === 'string') {
      return { id, created_at, ...parseCustomerInput(raw) }
    }
  }
  throw new Error('Malformed customer')
}

export function parseDeleted(raw: unknown): { id: string } {
  if (typeof raw === 'object' && raw !== null) {
    const { id } = raw as Record<string, unknown>
    if (typeof id === 'string') return { id }
  }
  throw new Error('Malformed delete result')
}
