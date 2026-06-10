import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { binValues, boxStats, extent } from './stats'

describe('binValues', () => {
  it('returns empty array for empty input', () => {
    expect(binValues([])).toEqual([])
  })

  it('returns single bin when all values are equal', () => {
    const bins = binValues([5, 5, 5])
    expect(bins).toHaveLength(1)
    expect(bins[0]?.count).toBe(3)
  })

  it('respects explicit binCount', () => {
    const bins = binValues([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)
    expect(bins).toHaveLength(5)
  })

  it('counts sum to n', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 2,
          maxLength: 200,
        }),
        (values) => {
          const bins = binValues(values)
          const total = bins.reduce((s, b) => s + b.count, 0)
          return total === values.length
        },
      ),
    )
  })

  it('bins cover [min, max]', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 2,
          maxLength: 200,
        }),
        (values) => {
          const sorted = [...values].sort((a, b) => a - b)
          const min = sorted[0] ?? 0
          const max = sorted[sorted.length - 1] ?? 0
          const bins = binValues(values)
          if (min === max) return true
          const eps = Math.abs(max - min) * 1e-9
          return (
            (bins[0]?.x0 ?? Infinity) <= min + eps &&
            (bins[bins.length - 1]?.x1 ?? -Infinity) >= max - eps
          )
        },
      ),
    )
  })

  it('bin boundaries are contiguous', () => {
    const bins = binValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (let i = 1; i < bins.length; i++) {
      expect(bins[i]?.x0).toBeCloseTo(bins[i - 1]?.x1 ?? 0, 10)
    }
  })
})

describe('boxStats', () => {
  it('handles empty input', () => {
    const s = boxStats([])
    expect(s.min).toBe(0)
    expect(s.outliers).toEqual([])
  })

  it('quartiles are ordered: min <= q1 <= median <= q3 <= max', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 4,
          maxLength: 100,
        }),
        (values) => {
          const s = boxStats(values)
          return s.min <= s.q1 && s.q1 <= s.median && s.median <= s.q3 && s.q3 <= s.max
        },
      ),
    )
  })

  it('outliers are not inside fences', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }), {
          minLength: 4,
          maxLength: 100,
        }),
        (values) => {
          const s = boxStats(values)
          const fence = 1.5 * (s.q3 - s.q1)
          const lo = s.q1 - fence
          const hi = s.q3 + fence
          return s.outliers.every((o) => o < lo || o > hi)
        },
      ),
    )
  })

  it('computes correct stats for known data', () => {
    const s = boxStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(s.median).toBe(5.5)
    expect(s.q1).toBeLessThan(s.median)
    expect(s.q3).toBeGreaterThan(s.median)
  })
})

describe('extent', () => {
  it('returns [0, 1] for empty array', () => {
    expect(extent([])).toEqual([0, 1])
  })

  it('returns [v, v] for single value', () => {
    expect(extent([5])).toEqual([5, 5])
  })

  it('returns [min, max]', () => {
    expect(extent([3, 1, 4, 1, 5, 9])).toEqual([1, 9])
  })
})
