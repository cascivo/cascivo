import { describe, expect, it } from 'vitest'
import { mannWhitneyU, summarize } from './stats.ts'

describe('summarize', () => {
  it('computes median/p25/p75 for odd-length samples', () => {
    const s = summarize([5, 1, 3, 2, 4])
    expect(s.median).toBe(3)
    expect(s.p25).toBe(2)
    expect(s.p75).toBe(4)
    expect(s.mean).toBe(3)
  })

  it('computes interpolated quartiles for even-length samples', () => {
    const s = summarize([1, 2, 3, 4])
    expect(s.median).toBe(2.5)
  })

  it('keeps the raw samples', () => {
    expect(summarize([2, 1]).samples).toEqual([1, 2])
  })
})

describe('mannWhitneyU', () => {
  it('returns U=0 for fully separated groups', () => {
    const { u, p } = mannWhitneyU([1, 2, 3], [10, 11, 12])
    expect(u).toBe(0)
    expect(p).toBeLessThan(0.1)
  })

  it('returns p ≈ 1 for identical groups', () => {
    const { p } = mannWhitneyU([5, 5, 5, 5], [5, 5, 5, 5])
    expect(p).toBeGreaterThan(0.9)
  })

  it('is symmetric', () => {
    const a = [3, 1, 4, 1, 5]
    const b = [9, 2, 6, 5, 3]
    expect(mannWhitneyU(a, b).p).toBeCloseTo(mannWhitneyU(b, a).p, 10)
  })
})
