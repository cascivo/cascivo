import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Pricing } from './pricing'

describe('Pricing', () => {
  it('renders a labeled pricing section', () => {
    render(<Pricing />)
    expect(screen.getByRole('region', { name: /pricing plans/i })).toBeInTheDocument()
  })

  it('renders all three tiers with prices', () => {
    render(<Pricing />)
    expect(screen.getByText('Hobby')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('$19')).toBeInTheDocument()
  })

  it('marks the featured tier with a Popular badge', () => {
    render(<Pricing />)
    expect(screen.getByText('Popular')).toBeInTheDocument()
  })

  it('renders a call-to-action button per tier', () => {
    render(<Pricing />)
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start free trial/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contact sales/i })).toBeInTheDocument()
  })
})
