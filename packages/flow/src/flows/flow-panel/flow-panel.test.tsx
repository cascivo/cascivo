import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowPanel } from './flow-panel.tsx'

describe('FlowPanel', () => {
  it('positions its children', () => {
    const { getByText, container } = render(<FlowPanel position="top-left">Legend</FlowPanel>)
    expect(getByText('Legend')).toBeInTheDocument()
    const el = container.firstChild as HTMLElement
    expect(el.dataset['position']).toBe('top-left')
  })

  it('defaults to top-right', () => {
    const { container } = render(<FlowPanel>x</FlowPanel>)
    expect((container.firstChild as HTMLElement).dataset['position']).toBe('top-right')
  })
})
