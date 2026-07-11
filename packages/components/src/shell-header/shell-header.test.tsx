import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MouseEvent } from 'react'
import { ShellHeader } from './shell-header'

describe('ShellHeader', () => {
  it('renders brand prefix and name', () => {
    render(<ShellHeader brand={{ prefix: 'cascivo', name: 'Console', href: '/' }} />)
    const brand = screen.getByRole('link', { name: 'cascivo Console' })
    expect(brand).toHaveAttribute('href', '/')
  })

  it('renders a skip-to-content link first in tab order', async () => {
    render(<ShellHeader brand={{ name: 'Console' }} />)
    await userEvent.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#cascade-main')
  })

  it('omits the skip link when skipToContentHref is false', () => {
    render(<ShellHeader brand={{ name: 'Console' }} skipToContentHref={false} />)
    expect(screen.queryByText('Skip to main content')).not.toBeInTheDocument()
  })

  it('renders hamburger only when onMenuClick is provided', async () => {
    const onMenuClick = vi.fn()
    const { rerender } = render(<ShellHeader brand={{ name: 'Console' }} />)
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument()
    rerender(
      <ShellHeader brand={{ name: 'Console' }} onMenuClick={onMenuClick} menuExpanded={false} />,
    )
    const burger = screen.getByRole('button', { name: 'Open navigation' })
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(burger)
    expect(onMenuClick).toHaveBeenCalledOnce()
  })
})

const navFixture = [
  { label: 'Dashboard', href: '/dash', active: true },
  {
    label: 'Manage',
    items: [
      { label: 'Users', href: '/users' },
      { label: 'Billing', href: '/billing', active: false },
    ],
  },
]

describe('ShellHeader nav', () => {
  it('renders plain links with aria-current', () => {
    render(<ShellHeader nav={navFixture} />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('forwards onClick on a nav link and lets it preventDefault', async () => {
    const onClick = vi.fn((e: MouseEvent) => e.preventDefault())
    render(<ShellHeader nav={[{ label: 'Trading', href: '#trading', active: true, onClick }]} />)
    await userEvent.click(screen.getByRole('link', { name: 'Trading' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]![0].defaultPrevented).toBe(true)
  })

  it('opens a dropdown menu on trigger click and closes on Escape', async () => {
    // jsdom hides popover elements from accessibility tree; query directly
    const { container } = render(<ShellHeader nav={navFixture} />)
    const trigger = screen.getByRole('button', { name: 'Manage' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = container.querySelector('[role="menu"]')
    expect(panel?.getAttribute('data-state')).toBe('open')
    expect(screen.getByText('Users')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('cycles menu items with arrow keys', async () => {
    render(<ShellHeader nav={navFixture} />)
    await userEvent.click(screen.getByRole('button', { name: 'Manage' }))
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByText('Users')).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByText('Billing')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByText('Users')).toHaveFocus()
  })

  it('marks a menu trigger active when a child is active', () => {
    const nav = [{ label: 'Manage', items: [{ label: 'Users', href: '/users', active: true }] }]
    render(<ShellHeader nav={nav} />)
    expect(screen.getByRole('button', { name: 'Manage' })).toHaveAttribute('data-state', 'active')
  })
})

describe('ShellHeader actions', () => {
  it('renders icon actions with accessible names and pressed state', async () => {
    const onClick = vi.fn()
    render(
      <ShellHeader
        actions={[
          {
            id: 'notifications',
            label: 'Notifications',
            icon: <svg aria-hidden="true" />,
            onClick,
            active: true,
          },
          { id: 'help', label: 'Help', icon: <svg aria-hidden="true" /> },
        ]}
      />,
    )
    const bell = screen.getByRole('button', { name: 'Notifications' })
    expect(bell).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Help' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(bell)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('ShellHeader stable keys', () => {
  it('does not warn about duplicate keys when nav links share an href placeholder', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ShellHeader
        brand={{ name: 'Acme' }}
        nav={[
          { label: 'Overview', href: '#', onClick: () => {} },
          { label: 'Reports', href: '#', onClick: () => {} },
          { label: 'Settings', href: '#', onClick: () => {} },
        ]}
      />,
    )
    const dupKeyWarning = spy.mock.calls.find((c) => String(c[0]).includes('same key'))
    expect(dupKeyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
