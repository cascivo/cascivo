import { describe, expect, it } from 'vitest'
import { isZoomed, panWindow, zoomWindow } from './zoom'

describe('zoomWindow', () => {
  it('zooms in (narrows) around a centre anchor', () => {
    const [s, e] = zoomWindow([0, 100], 101, 0.5, 0.5)
    expect(s).toBeGreaterThan(0)
    expect(e).toBeLessThan(100)
    expect(e - s).toBeLessThan(100)
  })

  it('keeps the left edge fixed when anchored at fraction 0', () => {
    const [s] = zoomWindow([0, 100], 101, 0.5, 0)
    expect(s).toBe(0)
  })

  it('zooms out (widens) and clamps to the full range', () => {
    const [s, e] = zoomWindow([40, 60], 101, 4, 0.5)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(e).toBeLessThanOrEqual(100)
    expect(e - s).toBeGreaterThan(20)
  })

  it('never collapses below a minimum span', () => {
    const [s, e] = zoomWindow([50, 51], 101, 0.01, 0.5)
    expect(e - s).toBeGreaterThanOrEqual(1)
  })

  it('handles a degenerate count', () => {
    expect(zoomWindow([0, 0], 1, 0.5, 0.5)).toEqual([0, 0])
  })
})

describe('panWindow', () => {
  it('shifts the window preserving its width', () => {
    expect(panWindow([10, 20], 101, 5)).toEqual([15, 25])
  })

  it('clamps at the start', () => {
    expect(panWindow([2, 12], 101, -10)).toEqual([0, 10])
  })

  it('clamps at the end', () => {
    expect(panWindow([90, 100], 101, 10)).toEqual([90, 100])
  })
})

describe('isZoomed', () => {
  it('is false for the full range and true otherwise', () => {
    expect(isZoomed([0, 100], 101)).toBe(false)
    expect(isZoomed([10, 100], 101)).toBe(true)
    expect(isZoomed([0, 90], 101)).toBe(true)
  })
})
