import { describe, expect, it } from 'vitest'
import { applyLayout, gridLayout, layeredLayout } from './layout.ts'
import type { FlowEdge, FlowNode } from './types.ts'

const nodes = (ids: string[]): FlowNode[] => ids.map((id) => ({ id, position: { x: 0, y: 0 } }))

describe('gridLayout', () => {
  it('places nodes in a deterministic grid', () => {
    const out = gridLayout(nodes(['a', 'b', 'c', 'd']), {
      columns: 2,
      gap: 50,
      nodeWidth: 100,
      nodeHeight: 40,
    })
    expect(out[0]!.position).toEqual({ x: 0, y: 0 })
    expect(out[1]!.position).toEqual({ x: 150, y: 0 })
    expect(out[2]!.position).toEqual({ x: 0, y: 90 })
    expect(out[3]!.position).toEqual({ x: 150, y: 90 })
  })
})

describe('layeredLayout', () => {
  it('layers a DAG by longest path', () => {
    const ns = nodes(['a', 'b', 'c', 'd'])
    const edges: FlowEdge[] = [
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ac', source: 'a', target: 'c' },
      { id: 'bd', source: 'b', target: 'd' },
      { id: 'cd', source: 'c', target: 'd' },
    ]
    const out = layeredLayout(ns, edges, {
      direction: 'LR',
      gap: 60,
      nodeWidth: 100,
      nodeHeight: 40,
    })
    const x = (id: string) => out.find((n) => n.id === id)!.position.x
    // a in layer 0, b/c in layer 1, d in layer 2 (longest path a→b→d / a→c→d).
    expect(x('a')).toBe(0)
    expect(x('b')).toBe(160)
    expect(x('c')).toBe(160)
    expect(x('d')).toBe(320)
  })

  it('does not crash on a cycle', () => {
    const ns = nodes(['a', 'b'])
    const edges: FlowEdge[] = [
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ba', source: 'b', target: 'a' },
    ]
    const out = layeredLayout(ns, edges)
    expect(out).toHaveLength(2)
  })
})

describe('applyLayout', () => {
  it('dispatches by strategy', () => {
    const ns = nodes(['a', 'b'])
    expect(applyLayout(ns, [], 'grid')).toHaveLength(2)
    expect(
      applyLayout(ns, [], (n) => n.map((x) => ({ ...x, position: { x: 9, y: 9 } })))[0]!.position,
    ).toEqual({
      x: 9,
      y: 9,
    })
  })
})
