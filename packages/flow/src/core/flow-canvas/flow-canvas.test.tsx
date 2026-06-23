import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowCanvas } from './flow-canvas.tsx'

describe('FlowCanvas', () => {
  it('renders children inside the transformed pane', () => {
    const { getByText } = render(
      <FlowCanvas>
        <span>node-content</span>
      </FlowCanvas>,
    )
    expect(getByText('node-content')).toBeInTheDocument()
  })

  it('applies the --flow-* custom properties from a controlled viewport', () => {
    const { container } = render(
      <FlowCanvas viewport={{ x: 5, y: 10, zoom: 2 }}>
        <span>x</span>
      </FlowCanvas>,
    )
    const pane = container.querySelector('[style*="--flow-scale"]') as HTMLElement
    expect(pane).not.toBeNull()
    expect(pane.style.getPropertyValue('--flow-tx')).toBe('5px')
    expect(pane.style.getPropertyValue('--flow-ty')).toBe('10px')
    expect(pane.style.getPropertyValue('--flow-scale')).toBe('2')
  })

  it('exposes role="application" by default', () => {
    const { getByRole } = render(
      <FlowCanvas>
        <span>x</span>
      </FlowCanvas>,
    )
    expect(getByRole('application')).toBeInTheDocument()
  })
})
