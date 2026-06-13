import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AutoGrid } from './auto-grid'

describe('AutoGrid', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AutoGrid>
        <div>Item</div>
      </AutoGrid>,
    )
    expect(getByText('Item')).toBeInTheDocument()
  })

  it('sets --_min CSS var from min prop', () => {
    const { container } = render(<AutoGrid min="12rem" />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_min')).toBe('12rem')
  })

  it('sets --_gap CSS var from gap prop', () => {
    const { container } = render(<AutoGrid gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('merges className', () => {
    const { container } = render(<AutoGrid className="extra" />)
    expect((container.firstChild as HTMLElement).className).toContain('extra')
  })

  it('forwards extra props', () => {
    const { container } = render(<AutoGrid data-testid="ag" />)
    expect((container.firstChild as HTMLElement).dataset.testid).toBe('ag')
  })
})
