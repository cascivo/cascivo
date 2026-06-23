import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { handleAnchor } from '../../engine/geometry.ts'
import type { FlowNode } from '../../engine/types.ts'
import { FlowHandle } from './flow-handle.tsx'

describe('FlowHandle', () => {
  it('renders a source at the default right position', () => {
    const { container } = render(<FlowHandle type="source" />)
    const el = container.querySelector('[data-flow-handle]') as HTMLElement
    expect(el.dataset['handleType']).toBe('source')
    expect(el.dataset['handlePos']).toBe('right')
  })

  it('renders a target at an explicit position with its id', () => {
    const { container } = render(<FlowHandle type="target" position="top" id="in" />)
    const el = container.querySelector('[data-flow-handle]') as HTMLElement
    expect(el.dataset['handleType']).toBe('target')
    expect(el.dataset['handlePos']).toBe('top')
    expect(el.dataset['handleId']).toBe('in')
  })

  it('handleAnchor reports the expected attach point for a known node size', () => {
    const node: FlowNode = { id: 'a', position: { x: 100, y: 100 }, width: 200, height: 100 }
    expect(handleAnchor(node, 'right')).toEqual({ x: 300, y: 150 })
    expect(handleAnchor(node, 'left')).toEqual({ x: 100, y: 150 })
  })
})
