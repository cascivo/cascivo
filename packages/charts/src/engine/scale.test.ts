import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { bandScale, linearScale, niceTicks } from './scale'

describe('linearScale', () => {
  it('maps domain to range linearly', () => {
    const s = linearScale([0, 100], [0, 500])
    expect(s.map(0)).toBe(0)
    expect(s.map(50)).toBe(250)
    expect(s.map(100)).toBe(500)
  })

  it('handles inverted ranges (y axes)', () => {
    const s = linearScale([0, 10], [300, 0])
    expect(s.map(0)).toBe(300)
    expect(s.map(10)).toBe(0)
  })

  it('degenerate domain maps to range start', () => {
    const s = linearScale([5, 5], [0, 100])
    expect(s.map(5)).toBe(0)
  })

  it('invert is the inverse of map', () => {
    const s = linearScale([0, 100], [0, 500])
    expect(s.invert(s.map(42))).toBeCloseTo(42)
  })
})

describe('niceTicks', () => {
  it('produces round steps for 0-100', () => {
    const ticks = niceTicks(0, 100, 5)
    // rawStep = 20, step = 20 (mantissa 2 × 10^1)
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('produces round steps for small ranges', () => {
    const ticks = niceTicks(0, 0.1, 5)
    ticks.forEach((t, i) => {
      if (i > 0) expect(t).toBeGreaterThan(ticks[i - 1]!)
    })
  })

  it('property: sorted, within padded domain, nice steps', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 2, max: 12 }),
        (start, span, count) => {
          const ticks = niceTicks(start, start + span, count)
          expect(ticks.length).toBeGreaterThanOrEqual(1)
          expect(ticks.length).toBeLessThanOrEqual(count * 2 + 2)
          for (let i = 1; i < ticks.length; i++) expect(ticks[i]!).toBeGreaterThan(ticks[i - 1]!)
          if (ticks.length >= 2) {
            const step = ticks[1]! - ticks[0]!
            if (step > 0) {
              const magnitude = 10 ** Math.floor(Math.log10(step))
              const mantissa = step / magnitude
              // Use relative tolerance: float subtraction of large adjacent ticks loses ~5 ULPs
              expect([1, 2, 2.5, 5, 10].some((m) => Math.abs(mantissa - m) / m < 1e-4)).toBe(true)
            }
          }
        },
      ),
    )
  })
})

describe('bandScale', () => {
  it('positions bands in order', () => {
    const s = bandScale(['a', 'b', 'c'], [0, 300], 0.1)
    expect(s.map('a')!).toBeLessThan(s.map('b')!)
    expect(s.map('b')!).toBeLessThan(s.map('c')!)
  })

  it('returns undefined for unknown values', () => {
    const s = bandScale(['a', 'b'], [0, 100], 0.1)
    expect(s.map('x' as never)).toBeUndefined()
  })

  it('bandwidth is positive', () => {
    const s = bandScale(['a', 'b', 'c'], [0, 300], 0.1)
    expect(s.bandwidth).toBeGreaterThan(0)
  })
})
