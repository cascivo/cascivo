import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VisuallyHidden } from './visually-hidden'

describe('VisuallyHidden', () => {
  it('renders children inside a span', () => {
    render(<VisuallyHidden>Skip to results</VisuallyHidden>)
    const el = screen.getByText('Skip to results')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('SPAN')
  })

  it('keeps content available to accessibility queries', () => {
    render(
      <button type="button">
        <VisuallyHidden>Close dialog</VisuallyHidden>
      </button>,
    )
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })

  it('merges className and forwards arbitrary attributes', () => {
    render(
      <VisuallyHidden className="custom" data-testid="vh">
        hidden text
      </VisuallyHidden>,
    )
    const el = screen.getByTestId('vh')
    expect(el).toHaveClass('custom')
    expect(el.className).not.toBe('custom')
  })
})
