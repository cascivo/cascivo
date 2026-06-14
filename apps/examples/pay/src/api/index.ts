import { createMockApi } from '@cascivo/example-kit'
import { CUSTOMERS, DAILY_SERIES, PRODUCTS, TRANSACTIONS } from '../data/fixtures'
import type { Transaction, TxStatus } from '../data/fixtures'

export type Range = '7d' | '30d' | '90d'

export interface RevenueDatum {
  date: string
  revenue: number
}

export interface VolumeDatum {
  product: string
  volume: number
}

export interface TxPage {
  items: (Transaction & { customerName: string; productName: string })[]
  total: number
  page: number
}

const PAGE_SIZE = 10

export const api = createMockApi(7)

function cutoffDate(range: Range): Date {
  const now = new Date(Date.UTC(2026, 5, 14))
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setUTCDate(now.getUTCDate() - days + 1)
  return cutoff
}

const customerMap = new Map(CUSTOMERS.map((c) => [c.id, c]))
const productMap = new Map(PRODUCTS.map((p) => [p.id, p]))

function enrichTx(tx: Transaction) {
  return {
    ...tx,
    customerName: customerMap.get(tx.customerId)?.name ?? tx.customerId,
    productName: productMap.get(tx.productId)?.name ?? tx.productId,
  }
}

export function getRevenueSeries(range: Range): Promise<RevenueDatum[]> {
  return api.wrap(() => {
    const cutoff = cutoffDate(range)
    return DAILY_SERIES.filter((d) => new Date(d.date) >= cutoff).map((d) => ({
      date: d.date,
      revenue: d.revenue,
    }))
  })()
}

const PRODUCT_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08] as const

export function getVolumeByProduct(range: Range): Promise<VolumeDatum[]> {
  return api.wrap(() => {
    const cutoff = cutoffDate(range)
    const days = DAILY_SERIES.filter((d) => new Date(d.date) >= cutoff)
    const baseVolume = days.reduce((sum, d) => sum + d.volume, 0)
    return PRODUCTS.map((p, i) => ({
      product: p.name,
      volume: Math.round(baseVolume * (PRODUCT_WEIGHTS[i] ?? 0.1)),
    }))
  })()
}

export function listTransactions(
  range: Range,
  page: number,
  status?: TxStatus | 'all',
): Promise<TxPage> {
  return api.wrap(() => {
    const cutoff = cutoffDate(range)
    let items = TRANSACTIONS.filter((tx) => new Date(tx.timestamp) >= cutoff)
    if (status && status !== 'all') {
      items = items.filter((tx) => tx.status === status)
    }
    // Sort newest first
    items = [...items].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    const total = items.length
    const start = (page - 1) * PAGE_SIZE
    return {
      items: items.slice(start, start + PAGE_SIZE).map(enrichTx),
      total,
      page,
    }
  })()
}

// Mutates the in-memory transaction list optimistically
export function refundTx(txId: string): Promise<Transaction> {
  return api.wrap(() => {
    const idx = TRANSACTIONS.findIndex((tx) => tx.id === txId)
    if (idx === -1) throw new Error(`Transaction ${txId} not found`)
    const tx = TRANSACTIONS[idx]!
    const updated = { ...tx, status: 'refunded' as TxStatus }
    TRANSACTIONS[idx] = updated
    return updated
  })()
}
