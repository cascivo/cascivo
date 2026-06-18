import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Faq } from './faq'

describe('Faq', () => {
  it('renders a labeled FAQ section', () => {
    render(<Faq />)
    expect(screen.getByRole('region', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  it('renders a question trigger per item', () => {
    render(<Faq />)
    expect(screen.getByRole('button', { name: /do i own the code i add\?/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /how is theming handled\?/i })).toBeInTheDocument()
  })

  it('expands a question when its trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    const trigger = screen.getByRole('button', { name: /do i own the code i add\?/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
