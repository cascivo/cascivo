import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { binValues, boxStats, extent } from './stats'

/**
 * Property tests must be reproducible: `fc.assert` defaults to a clock-derived seed, so a
 * counterexample appears once in CI and vanishes on re-run — which is exactly what happened
 * here, and it cost a real diagnosis cycle before the underlying `binValues` bugs (a lost
 * count and a last bin short of `max`, both at subnormal scales) were found by hand.
 *
 * A fixed seed makes the input set identical on every run: the suite either always passes or
 * always fails, and a failure is debuggable. `numRuns` is raised well above the default 100
 * because the seed no longer varies, so breadth has to come from the run count.
 */
const DETERMINISTIC = { seed: 0x5ca1ab1e, numRuns: 2000 } as const

/** The value generator the binValues properties share. */
const VALUES = fc.array(
  fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
  { minLength: 2, maxLength: 200 },
)

/** boxStats needs at least four values for quartiles to be meaningful. */
const BOX_VALUES = fc.array(
  fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
  { minLength: 4, maxLength: 100 },
)

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
      fc.property(VALUES, (values) => {
        const bins = binValues(values)
        const total = bins.reduce((s, b) => s + b.count, 0)
        return total === values.length
      }),
      DETERMINISTIC,
    )
  })

  it('bins cover [min, max] exactly', () => {
    // No tolerance: the first edge IS min and the last edge IS max. The old assertion
    // allowed a relative epsilon, which both hid the short final edge and was itself
    // useless at subnormal scales, where `|max - min| * 1e-9` underflows to zero.
    fc.assert(
      fc.property(VALUES, (values) => {
        const sorted = [...values].sort((a, b) => a - b)
        const min = sorted[0] ?? 0
        const max = sorted[sorted.length - 1] ?? 0
        const bins = binValues(values)
        if (min === max) return true
        return bins[0]?.x0 === min && bins[bins.length - 1]?.x1 === max
      }),
      DETERMINISTIC,
    )
  })

  it('keeps every count when the range is too narrow to divide (regression)', () => {
    // `width` underflowed to 0, every boundary collapsed, `(v - min) / width` went to
    // `0 / 0 = NaN` for `v === min`, and `bins[NaN]` silently dropped that count.
    const bins = binValues([0, 5e-324], 200)
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(2)
    expect(bins).toHaveLength(1)
    expect(bins[0]?.x0).toBe(0)
    expect(bins[0]?.x1).toBe(5e-324)
  })

  it('reaches max exactly at subnormal scale (regression)', () => {
    // `min + k * width` landed short of `max` by more than a relative epsilon can express
    // down here, so the coverage contract was unverifiable rather than merely imprecise.
    const bins = binValues([0, 1e-320], 200)
    expect(bins[bins.length - 1]?.x1).toBe(1e-320)
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(2)
  })

  it('reaches max exactly at ordinary scale', () => {
    const bins = binValues([0, 1e-8], 200)
    expect(bins[bins.length - 1]?.x1).toBe(1e-8)
    expect(bins[0]?.x0).toBe(0)
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
      fc.property(BOX_VALUES, (values) => {
        const s = boxStats(values)
        return s.min <= s.q1 && s.q1 <= s.median && s.median <= s.q3 && s.q3 <= s.max
      }),
      DETERMINISTIC,
    )
  })

  it('outliers are not inside fences', () => {
    fc.assert(
      fc.property(BOX_VALUES, (values) => {
        const s = boxStats(values)
        const fence = 1.5 * (s.q3 - s.q1)
        const lo = s.q1 - fence
        const hi = s.q3 + fence
        return s.outliers.every((o) => o < lo || o > hi)
      }),
      DETERMINISTIC,
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
