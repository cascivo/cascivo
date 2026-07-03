import { describe, expect, it } from 'vitest'
import { buildMarket, SEED_ORDERS, SEED_POSITIONS } from '../src/data/seed'
import { getInstrument, INSTRUMENTS } from '../src/data/instruments'

describe('seed data', () => {
  it('defines a catalog of instruments', () => {
    expect(INSTRUMENTS.length).toBeGreaterThanOrEqual(4)
    for (const inst of INSTRUMENTS) {
      expect(inst.currency).toBe('EUR')
      expect(inst.code).toMatch(/^IE00/)
    }
  })

  it('builds a consistent market snapshot per instrument', () => {
    for (const inst of INSTRUMENTS) {
      const m = buildMarket(inst)
      expect(m.candles.D).toHaveLength(500)
      expect(m.candles.W.length).toBeGreaterThan(90)
      // Every interval ends at the same live price.
      for (const iv of ['10m', '1h', 'D', 'W'] as const) {
        expect(m.candles[iv][m.candles[iv].length - 1]!.close).toBe(m.lastPrice)
      }
      expect(m.dayLow).toBeLessThanOrEqual(m.lastPrice)
      expect(m.dayHigh).toBeGreaterThanOrEqual(m.lastPrice)
      expect(m.book.bids).toHaveLength(8)
      expect(m.book.asks).toHaveLength(8)
      expect(m.book.bids[0]!.price).toBeLessThan(m.book.asks[0]!.price)
    }
  })

  it('seeds a flagship position tuned to roughly +33% return', () => {
    const p = SEED_POSITIONS[0]!
    expect(p.instrumentId).toBe('gti')
    const last = buildMarket(getInstrument('gti')).lastPrice
    const ret = (last / p.costBasis - 1) * 100
    expect(ret).toBeGreaterThan(25)
    expect(ret).toBeLessThan(40)
  })

  it('seeds executed order history, newest first', () => {
    expect(SEED_ORDERS).toHaveLength(15)
    for (const o of SEED_ORDERS) expect(o.status).toBe('executed')
    for (let i = 1; i < SEED_ORDERS.length; i++) {
      expect(SEED_ORDERS[i - 1]!.placed).toBeGreaterThanOrEqual(SEED_ORDERS[i]!.placed)
    }
  })
})
