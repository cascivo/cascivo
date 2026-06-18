import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ShellHeader } from '../shell-header/shell-header'
import { SideNav } from '../side-nav/side-nav'
import { AppShell } from './app-shell'

const navItems = [
  { label: 'Dashboard', href: '/dash', active: true },
  { label: 'Settings', href: '/settings' },
]

function Shell(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return (
    <AppShell
      header={<ShellHeader brand={{ name: 'Acme' }} />}
      nav={<SideNav items={navItems} ariaLabel="Main" />}
      {...props}
    >
      <h1>Dashboard</h1>
    </AppShell>
  )
}

describe('AppShell', () => {
  it('renders header, nav, and main content with the skip-link target id', () => {
    const { container } = render(<Shell />)
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(container.querySelector('#cascade-main')).toBeInTheDocument()
  })

  it('binds the ShellHeader burger to the nav: it toggles open and sets inert when closed', async () => {
    render(<Shell />)
    // Defaults open on desktop (jsdom has no matchMedia), so the burger reads "Close".
    const burger = screen.getByRole('button', { name: 'Close navigation' })
    expect(burger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('app-shell-nav')).not.toHaveAttribute('inert')

    await userEvent.click(burger)
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByTestId('app-shell-nav')).toHaveAttribute('inert')
  })

  it('closes on Escape when open', async () => {
    render(<Shell />)
    expect(screen.getByTestId('app-shell-nav')).not.toHaveAttribute('inert')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByTestId('app-shell-nav')).toHaveAttribute('inert')
  })

  it('closes when the scrim is clicked', async () => {
    render(<Shell />)
    await userEvent.click(screen.getByTestId('app-shell-scrim'))
    expect(screen.getByTestId('app-shell-nav')).toHaveAttribute('inert')
  })

  it('honors the controlled open prop and reports changes via onOpenChange', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Shell open={true} onOpenChange={onOpenChange} />)
    expect(screen.getByTestId('app-shell-nav')).not.toHaveAttribute('inert')

    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    // Controlled: internal state does not change until the parent updates `open`.
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByTestId('app-shell-nav')).not.toHaveAttribute('inert')

    rerender(<Shell open={false} onOpenChange={onOpenChange} />)
    expect(screen.getByTestId('app-shell-nav')).toHaveAttribute('inert')
  })

  it('does not render the burger binding when no nav is provided', () => {
    render(
      <AppShell header={<ShellHeader brand={{ name: 'Acme' }} />}>
        <h1>No nav</h1>
      </AppShell>,
    )
    expect(screen.queryByRole('button', { name: /navigation/ })).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-shell-nav')).not.toBeInTheDocument()
  })

  it('renders without throwing on the server (SSR-safe)', () => {
    const html = renderToString(<Shell />)
    expect(html).toContain('Dashboard')
    expect(html).toContain('id="cascade-main"')
  })
})
