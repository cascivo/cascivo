import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Separator } from './separator'

describe('Separator', () => {
  it('renders a horizontal rule by default', () => {
    const { container } = render(<Separator />)
    expect(container.querySelector('hr')).toBeInTheDocument()
  })

  it('renders a vertical separator with role and orientation', () => {
    render(<Separator orientation="vertical" />)
    const sep = screen.getByRole('separator')
    expect(sep).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('is hidden from assistive tech when decorative', () => {
    render(<Separator orientation="vertical" decorative />)
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })
})
