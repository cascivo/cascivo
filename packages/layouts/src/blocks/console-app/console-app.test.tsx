import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsoleApp } from './console-app'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  localStorage.clear()
})

describe('ConsoleApp', () => {
  it('renders the shell header brand', () => {
    render(<ConsoleApp />)
    expect(screen.getAllByText('Console').length).toBeGreaterThan(0)
  })

  it('renders navigation', () => {
    render(<ConsoleApp />)
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
  })

  it('main has cascade-main id and tabIndex', () => {
    render(<ConsoleApp />)
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'cascade-main')
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('notifications action opens the panel', async () => {
    render(<ConsoleApp />)
    const btn = screen.getByRole('button', { name: 'Notifications' })
    await userEvent.click(btn)
    expect(screen.getByText('Instance i-001 started')).toBeInTheDocument()
  })

  it('opening switcher closes notifications', async () => {
    render(<ConsoleApp />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await userEvent.click(screen.getByRole('button', { name: 'Switch application' }))
    // notifications panel closed (data-state)
    const panels = document.querySelectorAll('[data-state="closed"]')
    const notifPanel = Array.from(panels).find(
      (el) => el.getAttribute('aria-label') === 'Notifications',
    )
    expect(notifPanel).toBeDefined()
  })

  it('table has data-label attributes for mobile card transform', () => {
    render(<ConsoleApp />)
    const tds = document.querySelectorAll('td[data-label]')
    expect(tds.length).toBeGreaterThan(0)
  })

  it('aside contains resource details dl', () => {
    render(<ConsoleApp />)
    expect(screen.getByText('Resource details')).toBeInTheDocument()
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Region').length).toBeGreaterThan(0)
    expect(screen.getByText('CPU')).toBeInTheDocument()
    expect(screen.getByText('Memory')).toBeInTheDocument()
  })

  it('table has thead and tbody with instance rows', () => {
    render(<ConsoleApp />)
    expect(document.querySelector('thead')).toBeInTheDocument()
    expect(document.querySelector('tbody')).toBeInTheDocument()
    expect(screen.getByText('web-01')).toBeInTheDocument()
    expect(screen.getByText('cache-01')).toBeInTheDocument()
  })
})
