import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Collapsible } from './collapsible'

afterEach(cleanup)

describe('Collapsible', () => {
  it('renders the trigger and content', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    expect(screen.getByRole('button', { name: 'Toggle' })).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('is closed by default', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles open and closed on click', async () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    const trigger = screen.getByRole('button', { name: 'Toggle' })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('respects defaultOpen', () => {
    render(
      <Collapsible defaultOpen trigger="Toggle">
        Body
      </Collapsible>,
    )
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('links trigger and region via aria attributes', () => {
    render(<Collapsible trigger="Toggle">Body</Collapsible>)
    const trigger = screen.getByRole('button', { name: 'Toggle' })
    const region = screen.getByRole('region')
    expect(trigger.getAttribute('aria-controls')).toBe(region.getAttribute('id'))
    expect(region.getAttribute('aria-labelledby')).toBe(trigger.getAttribute('id'))
  })

  it('does not toggle when disabled', async () => {
    render(
      <Collapsible disabled trigger="Toggle">
        Body
      </Collapsible>,
    )
    const trigger = screen.getByRole('button', { name: 'Toggle' })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
