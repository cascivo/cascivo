import { describe, expect, it } from 'vitest'
import { decimate, lttb, minmax, type Pt } from './decimate'

const ramp = (n: number): Pt[] => Array.from({ length: n }, (_, i) => [i, i] as Pt)

describe('lttb', () => {
  it('returns at most threshold points and keeps the endpoints', () => {
    const pts = ramp(1000)
    const out = lttb(pts, 50)
    expect(out.length).toBeLessThanOrEqual(50)
    expect(out[0]).toEqual([0, 0])
    expect(out[out.length - 1]).toEqual([999, 999])
  })

  it('is a no-op below the threshold', () => {
    const pts = ramp(10)
    expect(lttb(pts, 50)).toEqual(pts)
  })

  it('preserves a spike approximately', () => {
    const pts: Pt[] = ramp(500)
    pts[250] = [250, 10000] // a sharp spike
    const out = lttb(pts, 50)
    const peak = Math.max(...out.map((p) => p[1]))
    expect(peak).toBeGreaterThan(5000)
  })
})

describe('minmax', () => {
  it('keeps the true min and max of each bucket', () => {
    const pts: Pt[] = ramp(100)
    pts[40] = [40, -999]
    pts[60] = [60, 999]
    const out = minmax(pts, 20)
    expect(Math.min(...out.map((p) => p[1]))).toBe(-999)
    expect(Math.max(...out.map((p) => p[1]))).toBe(999)
  })

  it('is a no-op below the threshold', () => {
    const pts = ramp(10)
    expect(minmax(pts, 50)).toEqual(pts)
  })
})

describe('decimate', () => {
  it('dispatches to the chosen method', () => {
    const pts = ramp(200)
    expect(decimate(pts, 20, 'lttb')).toEqual(lttb(pts, 20))
    expect(decimate(pts, 20, 'minmax')).toEqual(minmax(pts, 20))
  })
})
