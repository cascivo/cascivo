import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowNode } from './flow-node.tsx'

describe('FlowNode', () => {
  it('renders children and applies --flow-x/--flow-y from position', () => {
    const { getByText, container } = render(
      <FlowNode id="a" position={{ x: 120, y: 40 }}>
        Node A
      </FlowNode>,
    )
    expect(getByText('Node A')).toBeInTheDocument()
    const el = container.querySelector('[data-node-id="a"]') as HTMLElement
    expect(el.style.getPropertyValue('--flow-x')).toBe('120px')
    expect(el.style.getPropertyValue('--flow-y')).toBe('40px')
  })

  it('click selects and fires onSelect', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <FlowNode id="a" position={{ x: 0, y: 0 }} selected onSelect={onSelect}>
        A
      </FlowNode>,
    )
    const el = container.querySelector('[data-node-id="a"]') as HTMLElement
    expect(el).toHaveAttribute('data-selected', 'true')
    fireEvent.click(el)
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('a zoom-corrected drag updates the position', () => {
    const onPositionChange = vi.fn()
    const { container } = render(
      <FlowNode id="a" position={{ x: 0, y: 0 }} zoom={2} onPositionChange={onPositionChange}>
        A
      </FlowNode>,
    )
    const el = container.querySelector('[data-node-id="a"]') as HTMLElement
    // Drag 100px right / 40px down at zoom 2 → flow delta (50, 20).
    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(window, { clientX: 100, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(window, { clientX: 100, clientY: 40, pointerId: 1 })
    expect(onPositionChange).toHaveBeenCalled()
    const last = onPositionChange.mock.calls.at(-1)?.[0]
    expect(last.x).toBeCloseTo(50)
    expect(last.y).toBeCloseTo(20)
  })
})
