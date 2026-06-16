import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders sidebar nav links', () => {
    render(<AppShell />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(5)
  })

  it('renders content area with heading', () => {
    render(<AppShell />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('renders mobile menu toggle button', () => {
    render(<AppShell />)
    expect(screen.getByRole('button', { name: /open menu|menu/i })).toBeInTheDocument()
  })

  it('sidebar opens and closes via toggle', async () => {
    const user = userEvent.setup()
    render(<AppShell />)
    const toggle = screen.getByRole('button', { name: /open menu|menu/i })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
