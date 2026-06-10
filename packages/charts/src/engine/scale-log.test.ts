import { describe, expect, it } from 'vitest'
import { logScale } from './scale-log'

describe('logScale', () => {
  it('maps powers of 10', () => {
    const s = logScale([1, 1000], [0, 300])
    expect(s.map(1)).toBeCloseTo(0)
    expect(s.map(10)).toBeCloseTo(100)
    expect(s.map(100)).toBeCloseTo(200)
    expect(s.map(1000)).toBeCloseTo(300)
  })

  it('throws on non-positive domain', () => {
    expect(() => logScale([0, 100], [0, 300])).toThrow(/strictly positive/)
    expect(() => logScale([-1, 100], [0, 300])).toThrow(/strictly positive/)
  })

  it('invert is the inverse of map', () => {
    const s = logScale([1, 1000], [0, 300])
    expect(s.invert(s.map(42))).toBeCloseTo(42, 5)
  })

  it('ticks are powers of 10 within domain', () => {
    const s = logScale([1, 10000], [0, 400])
    const ticks = s.ticks()
    expect(ticks).toContain(1)
    expect(ticks).toContain(10)
    expect(ticks).toContain(100)
    expect(ticks).toContain(1000)
    expect(ticks).toContain(10000)
    ticks.forEach((t) => {
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(10000)
    })
  })
})
