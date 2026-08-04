import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Faq } from './faq'

describe('Faq', () => {
  it('renders a labeled FAQ section', () => {
    render(<Faq />)
    expect(screen.getByRole('region', { name: /frequently asked questions/i })).toBeInTheDocument()
  })

  // Accordion is built on `<details>`/`<summary>`; jsdom exposes neither the button role
  // nor `aria-expanded` for a `<summary>`, so triggers are found as headings and the
  // expanded state is read off `details.open`.
  it('renders a question trigger per item', () => {
    render(<Faq />)
    expect(screen.getByRole('heading', { name: /do i own the code i add\?/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how is theming handled\?/i })).toBeInTheDocument()
  })

  it('expands a question when its trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    const trigger = screen.getByRole('heading', { name: /do i own the code i add\?/i })
    const item = trigger.closest('details') as HTMLDetailsElement
    expect(item.open).toBe(false)
    await user.click(trigger)
    expect(item.open).toBe(true)
  })
})
