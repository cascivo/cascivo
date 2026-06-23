import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowEdge } from './flow-edge.tsx'

const coords = { sourceX: 0, sourceY: 0, targetX: 100, targetY: 0 }

describe('FlowEdge', () => {
  it('renders a path with a d derived from the anchors (bezier default)', () => {
    const { container } = render(<FlowEdge id="e" {...coords} />)
    const path = container.querySelector('path[marker-end]') as SVGPathElement
    expect(path.getAttribute('d')).toBe('M0,0 C25,0 75,0 100,0')
  })

  it('type switches the builder', () => {
    const { container } = render(<FlowEdge id="e" type="straight" {...coords} />)
    const path = container.querySelector('path[marker-end]') as SVGPathElement
    expect(path.getAttribute('d')).toBe('M0,0 L100,0')
  })

  it('animated sets data-animated; direction is reflected', () => {
    const { container } = render(<FlowEdge id="e" animated direction="reverse" {...coords} />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg).toHaveAttribute('data-animated', 'true')
    expect(svg).toHaveAttribute('data-direction', 'reverse')
  })

  it('selected sets data-selected', () => {
    const { container } = render(<FlowEdge id="e" selected {...coords} />)
    expect(container.querySelector('svg')).toHaveAttribute('data-selected', 'true')
  })

  it('arrows are configurable per end', () => {
    const fwd = render(<FlowEdge id="f" {...coords} />)
    expect(fwd.container.querySelector('path[marker-end]')).not.toBeNull()
    expect(fwd.container.querySelector('path[marker-start]')).toBeNull()

    const both = render(<FlowEdge id="b" markerStart {...coords} />)
    expect(both.container.querySelector('path[marker-start]')).not.toBeNull()
    expect(both.container.querySelector('path[marker-end]')).not.toBeNull()

    const none = render(<FlowEdge id="n" markerEnd={false} {...coords} />)
    expect(none.container.querySelector('path[marker-end]')).toBeNull()
    expect(none.container.querySelector('path[marker-start]')).toBeNull()
    // No marker def when neither end has an arrow.
    expect(none.container.querySelector('marker')).toBeNull()
  })

  it('label renders at the midpoint', () => {
    const { getByText } = render(<FlowEdge id="e" label="sync" {...coords} />)
    const label = getByText('sync')
    expect(label.style.getPropertyValue('--flow-label-x')).toBe('50px')
    expect(label.style.getPropertyValue('--flow-label-y')).toBe('0px')
  })
})
