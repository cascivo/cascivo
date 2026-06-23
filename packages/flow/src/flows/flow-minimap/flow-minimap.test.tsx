import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FlowNode } from '../../engine/types.ts'
import { FlowMiniMap } from './flow-minimap.tsx'

const nodes: FlowNode[] = [
  { id: 'a', position: { x: 0, y: 0 }, width: 100, height: 50 },
  { id: 'b', position: { x: 200, y: 120 }, width: 100, height: 50 },
]

describe('FlowMiniMap', () => {
  it('renders a rect per node plus the viewport rect', () => {
    const { container } = render(
      <FlowMiniMap
        nodes={nodes}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        containerWidth={400}
        containerHeight={300}
      />,
    )
    expect(container.querySelectorAll('rect[data-node-id]')).toHaveLength(2)
    expect(container.querySelector('rect[data-viewport]')).not.toBeNull()
  })

  it('omits the viewport rect without a container size', () => {
    const { container } = render(<FlowMiniMap nodes={nodes} viewport={{ x: 0, y: 0, zoom: 1 }} />)
    expect(container.querySelector('rect[data-viewport]')).toBeNull()
  })

  it('dragging the viewport rect pans the main viewport', () => {
    const onViewportChange = vi.fn()
    const { container } = render(
      <FlowMiniMap
        nodes={nodes}
        viewport={{ x: 0, y: 0, zoom: 1 }}
        containerWidth={400}
        containerHeight={300}
        onViewportChange={onViewportChange}
      />,
    )
    const rect = container.querySelector('rect[data-viewport]') as SVGRectElement
    fireEvent.pointerDown(rect, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 20, clientY: 10, pointerId: 1 })
    fireEvent.pointerUp(window, { clientX: 20, clientY: 10, pointerId: 1 })
    expect(onViewportChange).toHaveBeenCalled()
  })
})
