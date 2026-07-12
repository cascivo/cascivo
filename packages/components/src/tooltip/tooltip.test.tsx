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

  it('uses stable, colon-free, unique ids (SSR-safe, CSS-anchor-safe)', () => {
    render(
      <>
        <Tooltip content="One">
          <button type="button">A</button>
        </Tooltip>
        <Tooltip content="Two">
          <button type="button">B</button>
        </Tooltip>
      </>,
    )
    const [t1, t2] = screen.getAllByRole('tooltip')
    // No colons — a colon would break the CSS anchor-name custom property.
    expect(t1!.id).not.toContain(':')
    expect(t1!.getAttribute('data-anchor')).not.toContain(':')
    // Distinct per instance so two tooltips don't collide.
    expect(t1!.id).not.toBe(t2!.id)
    expect(t1!.getAttribute('data-anchor')).not.toBe(t2!.getAttribute('data-anchor'))
  })
})
