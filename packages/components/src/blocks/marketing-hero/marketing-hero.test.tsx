import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarketingHero } from './marketing-hero'

describe('MarketingHero', () => {
  it('renders a primary heading', () => {
    render(<MarketingHero />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders primary and ghost CTA buttons', () => {
    render(<MarketingHero />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('renders three trust badges', () => {
    render(<MarketingHero />)
    expect(screen.getAllByTestId('trust-badge')).toHaveLength(3)
  })
})
