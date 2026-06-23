import { describe, expect, it } from 'vitest'
import { fitViewport, graphBounds, handleAnchor, nodeBounds, nodeSize } from './geometry.ts'
import type { FlowNode } from './types.ts'

const node: FlowNode = { id: 'a', position: { x: 100, y: 50 }, width: 200, height: 80 }

describe('geometry', () => {
  it('nodeSize falls back to the default footprint', () => {
    expect(nodeSize({ id: 'x', position: { x: 0, y: 0 } })).toEqual({ width: 150, height: 40 })
    expect(nodeSize(node)).toEqual({ width: 200, height: 80 })
  })

  it('nodeBounds', () => {
    expect(nodeBounds(node)).toEqual({ x: 100, y: 50, width: 200, height: 80 })
  })

  it('handleAnchor for all four positions', () => {
    expect(handleAnchor(node, 'top')).toEqual({ x: 200, y: 50 })
    expect(handleAnchor(node, 'right')).toEqual({ x: 300, y: 90 })
    expect(handleAnchor(node, 'bottom')).toEqual({ x: 200, y: 130 })
    expect(handleAnchor(node, 'left')).toEqual({ x: 100, y: 90 })
  })

  it('graphBounds encloses all nodes', () => {
    const nodes: FlowNode[] = [
      { id: 'a', position: { x: 0, y: 0 }, width: 100, height: 50 },
      { id: 'b', position: { x: 200, y: 100 }, width: 100, height: 50 },
    ]
    expect(graphBounds(nodes)).toEqual({ x: 0, y: 0, width: 300, height: 150 })
    expect(graphBounds([])).toBeNull()
  })

  it('fitViewport frames a graph centered for a known container size', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 }
    const vp = fitViewport(bounds, { width: 400, height: 400 }, { padding: 0 })
    expect(vp.zoom).toBe(2)
    // Center of bounds (50,50) maps to center of container (200,200): 50*2 + x = 200.
    expect(vp.x).toBe(100)
    expect(vp.y).toBe(100)
  })

  it('fitViewport degrades gracefully for empty bounds', () => {
    const vp = fitViewport({ x: 0, y: 0, width: 0, height: 0 }, { width: 200, height: 200 })
    expect(vp.zoom).toBe(1)
  })
})
