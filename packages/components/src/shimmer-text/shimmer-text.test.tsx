import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShimmerText } from './shimmer-text'

describe('ShimmerText', () => {
  it('renders its text as readable content in a span by default', () => {
    render(<ShimmerText>Thinking…</ShimmerText>)
    const el = screen.getByText('Thinking…')
    expect(el.tagName).toBe('SPAN')
  })

  it('renders as the requested element', () => {
    render(<ShimmerText as="p">Searching…</ShimmerText>)
    expect(screen.getByText('Searching…').tagName).toBe('P')
  })

  it('is not a live region on its own', () => {
    render(<ShimmerText>Thinking…</ShimmerText>)
    const el = screen.getByText('Thinking…')
    expect(el).not.toHaveAttribute('role')
    expect(el).not.toHaveAttribute('aria-live')
  })

  it('merges className and passes attributes through', () => {
    render(
      <ShimmerText className="custom" data-testid="s">
        Working
      </ShimmerText>,
    )
    expect(screen.getByTestId('s')).toHaveClass('custom')
  })
})
