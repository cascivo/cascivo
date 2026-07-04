import { describe, expect, it } from 'vitest'
import { aggregate, genCandles, INTERVAL_MS } from './candles'

const opts = {
  seed: 123,
  count: 50,
  start: 40,
  drift: 0.0005,
  vol: 0.01,
  stepMs: INTERVAL_MS.D,
  endTime: 1_700_000_000_000,
}

describe('genCandles', () => {
  it('is deterministic for a given seed', () => {
    const a = genCandles(opts)
    const b = genCandles(opts)
    expect(a).toEqual(b)
  })

  it('produces valid OHLC brackets and positive volume', () => {
    for (const c of genCandles(opts)) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close))
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close))
      expect(c.volume).toBeGreaterThan(0)
    }
  })

  it('spaces buckets by stepMs ending at endTime', () => {
    const c = genCandles({ ...opts, count: 3 })
    expect(c[2]!.t).toBe(opts.endTime)
    expect(c[1]!.t).toBe(opts.endTime - INTERVAL_MS.D)
    expect(c[0]!.t).toBe(opts.endTime - 2 * INTERVAL_MS.D)
  })
})

describe('aggregate', () => {
  it('rolls up open/close/high/low/volume correctly', () => {
    const daily = genCandles(opts)
    const weekly = aggregate(daily, 5)
    expect(weekly).toHaveLength(10)
    const first = weekly[0]!
    const group = daily.slice(0, 5)
    expect(first.open).toBe(group[0]!.open)
    expect(first.close).toBe(group[4]!.close)
    expect(first.high).toBe(Math.max(...group.map((c) => c.high)))
    expect(first.low).toBe(Math.min(...group.map((c) => c.low)))
    expect(first.volume).toBe(group.reduce((s, c) => s + c.volume, 0))
  })
})
