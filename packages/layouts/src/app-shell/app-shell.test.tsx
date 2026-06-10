import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppShell } from './app-shell'

// suppress storage errors in jsdom
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('AppShell', () => {
  it('renders header slot', () => {
    render(
      <AppShell header={<nav>Header</nav>} persistKey={false}>
        content
      </AppShell>,
    )
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('renders children in main', () => {
    render(
      <AppShell header={<div />} persistKey={false}>
        <p>Main content</p>
      </AppShell>,
    )
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })

  it('renders sideNav', () => {
    render(
      <AppShell header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppShell>,
    )
    expect(screen.getByText('Nav')).toBeInTheDocument()
  })

  it('toggle button flips nav data-state', () => {
    render(
      <AppShell header={<div />} sideNav={<div>Nav</div>} persistKey={false}>
        children
      </AppShell>,
    )
    const nav = document.querySelector('[data-state]')!
    expect(nav).toHaveAttribute('data-state', 'expanded')
    fireEvent.click(screen.getByRole('button'))
    expect(nav).toHaveAttribute('data-state', 'collapsed')
  })

  it('renders aside slot', () => {
    render(
      <AppShell header={<div />} aside={<div>Aside</div>} persistKey={false}>
        children
      </AppShell>,
    )
    expect(screen.getByText('Aside')).toBeInTheDocument()
  })
})
