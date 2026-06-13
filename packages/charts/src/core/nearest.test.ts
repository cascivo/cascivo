import { describe, expect, it } from 'vitest'
import { nearest } from './nearest'
import type { ChartPoint } from './data-point'

function pt(id: string, cx: number, cy: number): ChartPoint {
  return { id, cx, cy, label: id, value: 0 }
}

describe('nearest', () => {
  it('returns -1 for empty array', () => {
    expect(nearest([], 5, 5)).toBe(-1)
    expect(nearest([], 5, 5, 'x')).toBe(-1)
  })

  describe('x strategy', () => {
    const points = [pt('a', 10, 50), pt('b', 50, 50), pt('c', 90, 50)]

    it('finds nearest to 45 → index 1 (x=50)', () => {
      expect(nearest(points, 45, 0, 'x')).toBe(1)
    })

    it('finds nearest to 30 → index 0 (x=10) vs index 1 (x=50): 20 vs 20, picks first', () => {
      // 30 is exactly equidistant between 10 and 50 — loop picks first equal
      expect(nearest(points, 30, 0, 'x')).toBe(0)
    })

    it('finds nearest to 10 → index 0', () => {
      expect(nearest(points, 10, 999, 'x')).toBe(0)
    })

    it('finds nearest to 90 → index 2', () => {
      expect(nearest(points, 90, 0, 'x')).toBe(2)
    })

    it('ignores y coordinate', () => {
      expect(nearest(points, 45, 999, 'x')).toBe(1)
    })
  })

  describe('xy strategy', () => {
    const points = [pt('a', 0, 0), pt('b', 100, 0), pt('c', 50, 50)]

    it('returns index of closest point by Euclidean distance', () => {
      // Query at (10, 5) — closest to a(0,0): dist≈11.18, b: 90.14, c: 56.4
      expect(nearest(points, 10, 5)).toBe(0)
    })

    it('returns 1 for point near b', () => {
      expect(nearest(points, 95, 5)).toBe(1)
    })

    it('returns 2 for point near c', () => {
      expect(nearest(points, 52, 48)).toBe(2)
    })

    it('defaults to xy strategy', () => {
      // same as xy explicit
      const pts = [pt('a', 0, 0), pt('b', 0, 100)]
      expect(nearest(pts, 0, 60)).toBe(1)
    })
  })

  it('returns 0 for single point regardless of position', () => {
    expect(nearest([pt('a', 999, 999)], 0, 0)).toBe(0)
    expect(nearest([pt('a', 999, 999)], 0, 0, 'x')).toBe(0)
  })
})
