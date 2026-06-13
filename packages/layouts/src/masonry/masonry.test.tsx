import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Masonry } from './masonry'

describe('Masonry', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Masonry>
        <div>Card</div>
      </Masonry>,
    )
    expect(getByText('Card')).toBeInTheDocument()
  })

  it('sets --_cols CSS var from cols prop', () => {
    const { container } = render(<Masonry cols={4} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_cols')).toBe('4')
  })

  it('sets --_gap CSS var from gap prop', () => {
    const { container } = render(<Masonry gap={6} />)
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--_gap')).toBe(
      'var(--cascivo-space-6)',
    )
  })

  it('merges className', () => {
    const { container } = render(<Masonry className="extra" />)
    expect((container.firstChild as HTMLElement).className).toContain('extra')
  })

  it('forwards extra props', () => {
    const { container } = render(<Masonry data-testid="m" />)
    expect((container.firstChild as HTMLElement).dataset.testid).toBe('m')
  })
})
