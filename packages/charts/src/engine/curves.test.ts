import { describe, expect, it } from 'vitest'
import { linePath, areaPath, type Curve, type Point } from './shape'

const pts: Point[] = [
  [0, 0],
  [10, 20],
  [20, 5],
  [30, 25],
  [40, 10],
]

const CURVES: Curve[] = [
  'linear',
  'monotone',
  'step',
  'stepBefore',
  'stepAfter',
  'natural',
  'basis',
  'cardinal',
  'catmullRom',
]

describe('curve factories', () => {
  for (const curve of CURVES) {
    it(`${curve}: produces a non-empty, NaN-free path starting with M`, () => {
      const d = linePath(pts, curve)
      expect(d.length).toBeGreaterThan(0)
      expect(d.startsWith('M')).toBe(true)
      expect(d).not.toContain('NaN')
      expect(d).not.toContain('undefined')
    })
  }

  it('step variants emit only straight segments (no curves)', () => {
    for (const curve of ['step', 'stepBefore', 'stepAfter'] as Curve[]) {
      const d = linePath(pts, curve)
      expect(d).not.toContain('C')
      expect(d).toContain('L')
    }
  })

  it('interpolating curves pass through the first and last point', () => {
    for (const curve of ['natural', 'cardinal', 'catmullRom', 'monotone'] as Curve[]) {
      const d = linePath(pts, curve)
      expect(d.startsWith('M0,0')).toBe(true)
      expect(d.endsWith('40,10')).toBe(true)
    }
  })

  it('degrades gracefully for <3 points', () => {
    for (const curve of CURVES) {
      expect(linePath([[0, 0]], curve)).toBe('M0,0')
      const two = linePath(
        [
          [0, 0],
          [10, 10],
        ],
        curve,
      )
      expect(two).not.toContain('NaN')
      expect(two.startsWith('M0,0')).toBe(true)
    }
  })

  it('areaPath closes the path with the new curves', () => {
    const d = areaPath(pts, 100, 'natural')
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).not.toContain('NaN')
  })
})
