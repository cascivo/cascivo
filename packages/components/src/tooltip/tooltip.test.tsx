import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from './tooltip'

describe('Tooltip', () => {
  it('renders the trigger', () => {
    render(
      <Tooltip content="Helpful hint">
        <button type="button">Hover me</button>
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
  })

  it('starts hidden', () => {
    render(
      <Tooltip content="Helpful hint">
        <button type="button">Hover me</button>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'hidden')
  })

  it('shows on hover after the delay', async () => {
    render(
      <Tooltip content="Helpful hint" delay={0}>
        <button type="button">Hover me</button>
      </Tooltip>,
    )
    await userEvent.hover(screen.getByRole('button'))
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'visible'),
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-describedby')
  })

  it('hides on unhover', async () => {
    render(
      <Tooltip content="Helpful hint" delay={0}>
        <button type="button">Hover me</button>
      </Tooltip>,
    )
    const button = screen.getByRole('button')
    await userEvent.hover(button)
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'visible'),
    )
    await userEvent.unhover(button)
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'hidden')
  })
})
