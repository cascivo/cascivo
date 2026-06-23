import { describe, expect, it } from 'vitest'
import { clampZoom, flowToScreen, screenToFlow } from './transform.ts'
import type { Viewport } from './types.ts'

describe('transform', () => {
  it.each([
    { x: 0, y: 0, zoom: 1 },
    { x: 50, y: -30, zoom: 0.5 },
    { x: -120, y: 80, zoom: 2 },
  ] satisfies Viewport[])('screenToFlow/flowToScreen round-trip at %o', (viewport) => {
    const point = { x: 123, y: 456 }
    const flow = screenToFlow(point, viewport)
    const back = flowToScreen(flow, viewport)
    expect(back.x).toBeCloseTo(point.x)
    expect(back.y).toBeCloseTo(point.y)
  })

  it('flowToScreen applies zoom then translation', () => {
    const viewport: Viewport = { x: 10, y: 20, zoom: 2 }
    expect(flowToScreen({ x: 5, y: 5 }, viewport)).toEqual({ x: 20, y: 30 })
  })

  it('clampZoom bounds', () => {
    expect(clampZoom(5)).toBe(2)
    expect(clampZoom(0.01)).toBe(0.2)
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(10, 0.5, 4)).toBe(4)
  })
})
