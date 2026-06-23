import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFlow } from './store.ts'
import type { FlowEdge, FlowNode } from './types.ts'

const nodeA: FlowNode = { id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } }
const nodeB: FlowNode = { id: 'b', position: { x: 100, y: 0 }, data: { label: 'B' } }

describe('useFlow', () => {
  it('seeds default state', () => {
    const { result } = renderHook(() => useFlow({ defaultNodes: [nodeA, nodeB], defaultEdges: [] }))
    expect(result.current.nodes.value).toHaveLength(2)
    expect(result.current.edges.value).toEqual([])
    expect(result.current.viewport.value).toEqual({ x: 0, y: 0, zoom: 1 })
  })

  it('updateNode patches one node immutably', () => {
    const { result } = renderHook(() => useFlow({ defaultNodes: [nodeA, nodeB] }))
    const before = result.current.nodes.value
    result.current.updateNode('a', { position: { x: 50, y: 25 } })
    const after = result.current.nodes.value
    expect(after).not.toBe(before)
    expect(after[0]).not.toBe(before[0])
    expect(after[0]?.position).toEqual({ x: 50, y: 25 })
    expect(after[1]).toBe(before[1])
  })

  it('addEdge appends', () => {
    const { result } = renderHook(() => useFlow({ defaultNodes: [nodeA, nodeB] }))
    const edge: FlowEdge = { id: 'ab', source: 'a', target: 'b' }
    result.current.addEdge(edge)
    expect(result.current.edges.value).toEqual([edge])
  })

  it('setViewport updates', () => {
    const { result } = renderHook(() => useFlow())
    result.current.setViewport({ x: 10, y: 20, zoom: 1.5 })
    expect(result.current.viewport.value).toEqual({ x: 10, y: 20, zoom: 1.5 })
  })

  it('controlled nodes reflect props and route changes through onChange', () => {
    const onNodesChange = vi.fn()
    const { result } = renderHook(() => useFlow({ nodes: [nodeA], onNodesChange }))
    expect(result.current.nodes.value).toEqual([nodeA])
    result.current.updateNode('a', { selected: true })
    // Controlled: signal not mutated locally; the parent is asked to update.
    expect(onNodesChange).toHaveBeenCalledWith([{ ...nodeA, selected: true }])
    expect(result.current.nodes.value).toEqual([nodeA])
  })
})
