import { render } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { FlowEdge, FlowNode as FlowNodeData } from '../../engine/types.ts'
import { FlowNode } from '../flow-node/flow-node.tsx'
import { Flow } from './flow.tsx'

// jsdom has no layout: polyfill ResizeObserver (fires once on observe) and a
// fixed border-box so we can prove edges anchor to the *measured* node size
// rather than the 150x40 default.
const MEASURED_W = 100
const MEASURED_H = 40

class MockResizeObserver {
  private cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
  }
  observe(el: Element): void {
    const entry = {
      target: el,
      contentRect: { width: MEASURED_W, height: MEASURED_H },
    } as ResizeObserverEntry
    this.cb([entry], this as unknown as ResizeObserver)
  }
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = MockResizeObserver
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => MEASURED_W,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => MEASURED_H,
  })
})

afterAll(() => {
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
  delete (HTMLElement.prototype as unknown as { offsetWidth?: number }).offsetWidth
  delete (HTMLElement.prototype as unknown as { offsetHeight?: number }).offsetHeight
})

const nodes: FlowNodeData[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } },
  { id: 'b', position: { x: 200, y: 0 }, data: { label: 'B' } },
]
const edges: FlowEdge[] = [{ id: 'ab', source: 'a', target: 'b' }]

describe('FlowNode measurement', () => {
  it('reports its rendered border-box via onMeasure', () => {
    const onMeasure = vi.fn()
    render(
      <FlowNode id="a" position={{ x: 0, y: 0 }} onMeasure={onMeasure}>
        A
      </FlowNode>,
    )
    expect(onMeasure).toHaveBeenCalledWith({ width: MEASURED_W, height: MEASURED_H })
  })
})

describe('Flow edge anchoring (measured node size)', () => {
  it('starts the edge at the measured right edge of the source node', () => {
    const { container } = render(<Flow nodes={nodes} edges={edges} />)
    const path = container.querySelector('path[marker-end]') as SVGPathElement
    // source 'right' = (0 + 100, 40/2) = (100,20); target 'left' = (200, 20).
    // With the 150 default this would start at M150,... — measurement fixes it.
    expect(path.getAttribute('d')).toBe('M100,20 C125,20 175,20 200,20')
  })
})
