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

  it('label renders at the midpoint', () => {
    const { getByText } = render(<FlowEdge id="e" label="sync" {...coords} />)
    const label = getByText('sync')
    expect(label.style.getPropertyValue('--flow-label-x')).toBe('50px')
    expect(label.style.getPropertyValue('--flow-label-y')).toBe('0px')
  })
})
