import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FlowEdge, FlowNode } from '../../engine/types.ts'
import { Flow } from './flow.tsx'

const nodes: FlowNode[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } },
  { id: 'b', position: { x: 200, y: 0 }, data: { label: 'B' } },
]
const edges: FlowEdge[] = [{ id: 'ab', source: 'a', target: 'b' }]

describe('Flow', () => {
  it('renders a node per node and an edge per edge', () => {
    const { container, getByText } = render(<Flow nodes={nodes} edges={edges} />)
    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(2)
    expect(getByText('A')).toBeInTheDocument()
    expect(container.querySelectorAll('path[marker-end]')).toHaveLength(1)
  })

  it('uses a custom nodeTypes renderer', () => {
    const typed: FlowNode[] = [{ id: 'a', position: { x: 0, y: 0 }, type: 'custom', data: {} }]
    const { getByText } = render(
      <Flow
        nodes={typed}
        edges={[]}
        nodeTypes={{ custom: ({ node }) => <div>CUSTOM-{node.id}</div> }}
      />,
    )
    expect(getByText('CUSTOM-a')).toBeInTheDocument()
  })

  it("layout='grid' assigns positions", () => {
    const { container } = render(<Flow nodes={nodes} edges={[]} layout="grid" />)
    const els = container.querySelectorAll('[data-node-id]')
    const second = els[1] as HTMLElement
    // grid: second node in column 1 → x = nodeWidth(150) + gap(40) = 190.
    expect(second.style.getPropertyValue('--flow-x')).toBe('190px')
  })

  it('onConnect fires from a simulated handle drag', () => {
    const onConnect = vi.fn()
    const { container } = render(<Flow nodes={nodes} edges={[]} onConnect={onConnect} />)
    const sourceHandle = container.querySelector(
      '[data-node-id="a"] [data-handle-type="source"]',
    ) as HTMLElement
    const targetHandle = container.querySelector(
      '[data-node-id="b"] [data-handle-type="target"]',
    ) as HTMLElement
    fireEvent.pointerDown(sourceHandle, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerUp(targetHandle, { clientX: 10, clientY: 0, pointerId: 1 })
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ source: 'a', target: 'b' }))
  })
})
