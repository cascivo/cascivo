import { describe, expect, it } from 'vitest'
import { divergingRamp, rampLightness, rampOf, rampStops, sequentialRamp } from './ramp'

describe('sequentialRamp', () => {
  it('returns oklch strings and clamps out of range', () => {
    expect(sequentialRamp(0)).toMatch(/^oklch\(/)
    expect(sequentialRamp(-1)).toBe(sequentialRamp(0))
    expect(sequentialRamp(2)).toBe(sequentialRamp(1))
  })

  it('decreases monotonically in lightness (CVD-safe ordering)', () => {
    const l0 = rampLightness(sequentialRamp(0))
    const l5 = rampLightness(sequentialRamp(0.5))
    const l1 = rampLightness(sequentialRamp(1))
    expect(l0).toBeGreaterThan(l5)
    expect(l5).toBeGreaterThan(l1)
  })
})

describe('divergingRamp', () => {
  it('passes through a light neutral midpoint', () => {
    const lMid = rampLightness(divergingRamp(0.5))
    expect(lMid).toBeGreaterThan(rampLightness(divergingRamp(0)))
    expect(lMid).toBeGreaterThan(rampLightness(divergingRamp(1)))
  })
})

describe('rampStops', () => {
  it('returns n distinct colours with no NaN', () => {
    const stops = rampStops(5, 'sequential')
    expect(stops).toHaveLength(5)
    expect(new Set(stops).size).toBe(5)
    for (const s of stops) expect(Number.isNaN(rampLightness(s))).toBe(false)
  })

  it('handles n<=1', () => {
    expect(rampStops(1)).toHaveLength(1)
  })
})

describe('rampOf', () => {
  it('selects the diverging ramp', () => {
    expect(rampOf('diverging')(0.5)).toBe(divergingRamp(0.5))
    expect(rampOf('sequential')(0.5)).toBe(sequentialRamp(0.5))
  })
})
