import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingGroup } from './rating-group'

describe('RatingGroup', () => {
  it('renders 5 stars by default', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} />)
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('renders the specified max stars', () => {
    render(<RatingGroup value={2} max={10} onValueChange={() => {}} />)
    expect(screen.getAllByRole('radio')).toHaveLength(10)
  })

  it('has radiogroup role', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} />)
    expect(screen.getByRole('radiogroup')).toBeTruthy()
  })

  it('selected star has aria-checked=true', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} />)
    const stars = screen.getAllByRole('radio')
    expect(stars[2]).toHaveAttribute('aria-checked', 'true')
  })

  it('non-selected stars have aria-checked=false', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} />)
    const stars = screen.getAllByRole('radio')
    expect(stars[0]).toHaveAttribute('aria-checked', 'false')
    expect(stars[4]).toHaveAttribute('aria-checked', 'false')
  })

  it('each star has an aria-label', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} />)
    expect(screen.getByLabelText('1 of 5 stars')).toBeTruthy()
    expect(screen.getByLabelText('5 of 5 stars')).toBeTruthy()
  })

  it('calls onValueChange when star clicked', async () => {
    const handler = vi.fn()
    render(<RatingGroup value={3} onValueChange={handler} />)
    const stars = screen.getAllByRole('radio')
    await userEvent.click(stars[4]!)
    expect(handler).toHaveBeenCalledWith(5)
  })

  it('is disabled when disabled prop set', () => {
    render(<RatingGroup value={3} onValueChange={() => {}} disabled />)
    const stars = screen.getAllByRole('radio')
    stars.forEach((star) => expect(star).toBeDisabled())
  })

  it('renders data-size attribute', () => {
    const { container } = render(<RatingGroup value={3} onValueChange={() => {}} size="lg" />)
    expect(container.querySelector('[data-size="lg"]')).toBeTruthy()
  })

  it('filled stars have data-filled attribute', () => {
    const { container } = render(<RatingGroup value={3} onValueChange={() => {}} />)
    const filledStars = container.querySelectorAll('[data-filled]')
    expect(filledStars).toHaveLength(3)
  })

  it('uses custom label function', () => {
    render(
      <RatingGroup
        value={2}
        onValueChange={() => {}}
        labels={{ rating: (v, max) => `${v} star${v > 1 ? 's' : ''} out of ${max}` }}
      />,
    )
    expect(screen.getByLabelText('1 star out of 5')).toBeTruthy()
    expect(screen.getByLabelText('2 stars out of 5')).toBeTruthy()
  })
})
