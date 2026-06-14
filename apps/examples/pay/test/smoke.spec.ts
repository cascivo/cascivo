import { describe, it, expect } from 'vitest'
import { DAILY_SERIES, TRANSACTIONS, CUSTOMERS, PRODUCTS } from '../src/data/fixtures'
import { getRevenueSeries, getVolumeByProduct, listTransactions } from '../src/api'

describe('fixtures', () => {
  it('generates 90 days of daily data', () => {
    expect(DAILY_SERIES).toHaveLength(90)
  })

  it('generates 5 products', () => {
    expect(PRODUCTS).toHaveLength(5)
  })

  it('generates 50 customers', () => {
    expect(CUSTOMERS).toHaveLength(50)
  })

  it('generates 200 transactions', () => {
    expect(TRANSACTIONS).toHaveLength(200)
  })

  it('all transactions have valid status', () => {
    const valid = new Set(['succeeded', 'pending', 'refunded', 'failed'])
    expect(TRANSACTIONS.every((tx) => valid.has(tx.status))).toBe(true)
  })
})

describe('api', () => {
  it('getRevenueSeries returns data for 30d', async () => {
    const data = await getRevenueSeries('30d')
    expect(data.length).toBeGreaterThan(0)
    expect(data.length).toBeLessThanOrEqual(30)
  })

  it('getVolumeByProduct returns 5 products', async () => {
    const data = await getVolumeByProduct('30d')
    expect(data).toHaveLength(5)
    expect(data.every((d) => d.volume >= 0)).toBe(true)
  })

  it('listTransactions returns paginated results', async () => {
    const result = await listTransactions('90d', 1)
    expect(result.items.length).toBeLessThanOrEqual(10)
    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((tx) => typeof tx.customerName === 'string')).toBe(true)
  })

  it('listTransactions filters by status', async () => {
    const result = await listTransactions('90d', 1, 'succeeded')
    expect(result.items.every((tx) => tx.status === 'succeeded')).toBe(true)
  })
})
