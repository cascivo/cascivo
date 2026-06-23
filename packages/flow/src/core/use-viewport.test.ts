import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFlow } from '../engine/store.ts'
import type { FlowNode } from '../engine/types.ts'
import { useViewport, type UseViewportOptions } from './use-viewport.ts'

function setup(nodes: FlowNode[] = [], options: UseViewportOptions = {}) {
  return renderHook(() => {
    const flow = useFlow({ defaultNodes: nodes })
    const vp = useViewport(flow, options)
    return { flow, vp }
  })
}

describe('useViewport', () => {
  it('pan translates the viewport by a screen delta', () => {
    const { result } = setup()
    result.current.vp.pan(10, 20)
    expect(result.current.flow.viewport.value).toEqual({ x: 10, y: 20, zoom: 1 })
    result.current.vp.pan(-4, 6)
    expect(result.current.flow.viewport.value).toEqual({ x: 6, y: 26, zoom: 1 })
  })

  it('zoomTo clamps to the allowed range', () => {
    const { result } = setup()
    result.current.vp.zoomTo(5)
    expect(result.current.flow.viewport.value.zoom).toBe(2)
    result.current.vp.zoomTo(0.001)
    expect(result.current.flow.viewport.value.zoom).toBe(0.2)
  })

  it('zoomTo keeps a focal point fixed', () => {
    const { result } = setup()
    result.current.vp.zoomTo(2, { x: 100, y: 100 })
    // Flow point under (100,100) at zoom 1 is (100,100); it must stay under (100,100).
    const vp = result.current.flow.viewport.value
    expect(vp.zoom).toBe(2)
    expect(100 * vp.zoom + vp.x).toBeCloseTo(100)
    expect(100 * vp.zoom + vp.y).toBeCloseTo(100)
  })

  it('fitView frames the graph for an injected container size', () => {
    const nodes: FlowNode[] = [{ id: 'a', position: { x: 0, y: 0 }, width: 100, height: 100 }]
    const { result } = setup(nodes)
    result.current.vp.fitView({ width: 400, height: 400 })
    expect(result.current.flow.viewport.value).toEqual({ x: 100, y: 100, zoom: 2 })
  })

  it('fitView is a no-op with no nodes', () => {
    const { result } = setup()
    result.current.vp.fitView({ width: 400, height: 400 })
    expect(result.current.flow.viewport.value).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})
