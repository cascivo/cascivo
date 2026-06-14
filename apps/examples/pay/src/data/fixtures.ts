import { seededRandom } from '@cascivo/example-kit'

const rng = seededRandom(7)

// --- Products ---

export interface Product {
  id: string
  name: string
  category: string
}

const PRODUCT_NAMES = ['Pro Plan', 'Starter Plan', 'Enterprise Plan', 'Add-On Pack', 'API Access']
const PRODUCT_CATEGORIES = ['Subscription', 'Subscription', 'Subscription', 'One-time', 'API']

export const PRODUCTS: Product[] = PRODUCT_NAMES.map((name, i) => ({
  id: `prod-${i}`,
  name,
  category: PRODUCT_CATEGORIES[i]!,
}))

// --- Customers ---

export interface Customer {
  id: string
  name: string
  email: string
}

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eva',
  'Frank',
  'Grace',
  'Hiro',
  'Isla',
  'Jack',
]
const LAST_NAMES = [
  'Smith',
  'Jones',
  'Williams',
  'Brown',
  'Davis',
  'Miller',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
]
const DOMAINS = ['example.com', 'acme.io', 'test.org', 'demo.net', 'corp.dev']

export const CUSTOMERS: Customer[] = Array.from({ length: 50 }, (_, i) => {
  const first = rng.pick(FIRST_NAMES)
  const last = rng.pick(LAST_NAMES)
  const domain = rng.pick(DOMAINS)
  return {
    id: `cust-${i}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@${domain}`,
  }
})

// --- Daily Revenue / Volume Series (90 days) ---

export interface DailyPoint {
  date: string
  revenue: number
  volume: number
}

const BASE_DATE = new Date(Date.UTC(2026, 5, 14)) // 2026-06-14

export const DAILY_SERIES: DailyPoint[] = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(BASE_DATE)
  d.setUTCDate(BASE_DATE.getUTCDate() - (89 - i))
  const dateStr = d.toISOString().slice(0, 10)
  // revenue: base 5000 ± 3000, gently trending up
  const revenue = Math.round(5000 + i * 30 + rng.int(-3000, 3000))
  const volume = rng.int(40, 200)
  return { date: dateStr, revenue: Math.max(0, revenue), volume }
})

// --- Transactions ---

export type TxStatus = 'succeeded' | 'pending' | 'refunded' | 'failed'

export interface Transaction {
  id: string
  amount: number
  currency: 'USD'
  status: TxStatus
  customerId: string
  productId: string
  timestamp: string
}

const TX_STATUSES: TxStatus[] = [
  'succeeded',
  'succeeded',
  'succeeded',
  'succeeded',
  'pending',
  'refunded',
  'failed',
]

export const TRANSACTIONS: Transaction[] = Array.from({ length: 200 }, (_, i) => {
  const customer = rng.pick(CUSTOMERS)
  const product = rng.pick(PRODUCTS)
  const status = rng.pick(TX_STATUSES)
  const daysAgo = rng.int(0, 89)
  const d = new Date(BASE_DATE)
  d.setUTCDate(BASE_DATE.getUTCDate() - daysAgo)
  d.setUTCHours(rng.int(0, 23), rng.int(0, 59), 0, 0)
  return {
    id: `tx-${i}`,
    amount: rng.int(10, 500) * 100, // cents
    currency: 'USD',
    status,
    customerId: customer.id,
    productId: product.id,
    timestamp: d.toISOString(),
  }
})
