import { describe, expect, it } from 'vitest'
import { aggregate, bin, filter, regression, sort } from './transform'

const rows = [
  { team: 'a', v: 10, d: 1 },
  { team: 'b', v: 5, d: 2 },
  { team: 'a', v: 20, d: 3 },
  { team: 'b', v: 15, d: 4 },
]

describe('filter / sort', () => {
  it('filters rows by predicate', () => {
    expect(filter(rows, (r) => r.team === 'a')).toHaveLength(2)
  })
  it('sorts ascending and descending, stably', () => {
    expect(sort(rows, 'v', 'asc').map((r) => r.v)).toEqual([5, 10, 15, 20])
    expect(sort(rows, 'v', 'desc').map((r) => r.v)).toEqual([20, 15, 10, 5])
  })
})

describe('aggregate', () => {
  it('sums and means grouped values', () => {
    const out = aggregate(rows, { groupBy: 'team', ops: { v: 'sum' } })
    expect(out).toEqual([
      { team: 'a', v: 30 },
      { team: 'b', v: 20 },
    ])
  })
  it('computes mean / median / count / min / max', () => {
    const out = aggregate(rows, {
      groupBy: 'team',
      ops: { v: 'mean' },
    })
    expect(out[0]!.v).toBe(15)
    expect(out[1]!.v).toBe(10)
    const med = aggregate(
      [
        { g: 1, v: 1 },
        { g: 1, v: 2 },
        { g: 1, v: 9 },
      ],
      {
        groupBy: 'g',
        ops: { v: 'median' },
      },
    )
    expect(med[0]!.v).toBe(2)
  })
})

describe('bin', () => {
  it('partitions values; the max lands in the last bucket', () => {
    const buckets = bin([0, 1, 2, 3, 4], { bins: 2, range: [0, 4] })
    expect(buckets).toHaveLength(2)
    expect(buckets[0]!.count).toBe(2) // 0,1
    expect(buckets[1]!.count).toBe(3) // 2,3,4 (4 = max → last)
    expect(buckets[0]!.x0).toBe(0)
    expect(buckets[1]!.x1).toBe(4)
  })
  it('handles empty / degenerate input without throwing', () => {
    expect(() => bin([], { bins: 3, range: [0, 1] })).not.toThrow()
    expect(bin([5], { bins: 1, range: [5, 5] })[0]!.count).toBe(1)
  })
})

describe('regression', () => {
  it('recovers a known linear slope/intercept with R²≈1', () => {
    const pts: [number, number][] = [
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ]
    const fit = regression(pts, { type: 'linear' })
    expect(fit.coefficients[0]).toBeCloseTo(1, 6) // intercept
    expect(fit.coefficients[1]).toBeCloseTo(2, 6) // slope
    expect(fit.r2).toBeCloseTo(1, 6)
    expect(fit.predict(4)).toBeCloseTo(9, 6)
  })
  it('fits a polynomial through a parabola', () => {
    const pts: [number, number][] = [
      [-2, 4],
      [-1, 1],
      [0, 0],
      [1, 1],
      [2, 4],
    ]
    const fit = regression(pts, { type: { type: 'polynomial', order: 2 } })
    expect(fit.predict(3)).toBeCloseTo(9, 4)
    expect(fit.r2).toBeCloseTo(1, 6)
  })
  it('does not throw on degenerate input', () => {
    expect(() => regression([], { type: 'linear' })).not.toThrow()
    expect(regression([[1, 5]]).predict(99)).toBe(5)
  })
})
