import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SideNav, type SideNavItem } from './side-nav'

const items: SideNavItem[] = [
  { label: 'Home', href: '/', active: true },
  { label: 'Reports', href: '/reports' },
  {
    label: 'Settings',
    items: [
      { label: 'Profile', href: '/settings/profile' },
      { label: 'Billing', href: '/settings/billing' },
    ],
  },
]

describe('SideNav', () => {
  it('renders a nav with the default aria-label', () => {
    render(<SideNav items={items} />)
    expect(screen.getByRole('navigation', { name: 'Side navigation' })).toBeInTheDocument()
  })

  it('accepts a custom ariaLabel', () => {
    render(<SideNav items={items} ariaLabel="Admin" />)
    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument()
  })

  it('renders top-level links', () => {
    render(<SideNav items={items} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/reports')
  })

  it('marks the active item with aria-current and data-state', () => {
    render(<SideNav items={items} />)
    const active = screen.getByRole('link', { name: 'Home' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(active).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('link', { name: 'Reports' })).not.toHaveAttribute('aria-current')
  })

  it('renders groups collapsed by default', () => {
    render(<SideNav items={items} />)
    const trigger = screen.getByRole('button', { name: 'Settings' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    const sublistId = trigger.getAttribute('aria-controls')
    expect(sublistId).toBeTruthy()
    expect(document.getElementById(sublistId as string)).toHaveAttribute('data-state', 'closed')
  })

  it('toggles a group open and closed on click', async () => {
    render(<SideNav items={items} />)
    const trigger = screen.getByRole('button', { name: 'Settings' })
    const sublist = document.getElementById(trigger.getAttribute('aria-controls') as string)

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(sublist).toHaveAttribute('data-state', 'open')

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(sublist).toHaveAttribute('data-state', 'closed')
  })

  it('starts a group expanded when it contains the active item', () => {
    render(
      <SideNav
        items={[
          {
            label: 'Settings',
            items: [{ label: 'Profile', href: '/settings/profile', active: true }],
          },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const sub = screen.getByRole('link', { name: 'Profile' })
    expect(sub).toHaveAttribute('aria-current', 'page')
    expect(sub).toHaveAttribute('data-state', 'active')
  })

  it('toggles collapsed state uncontrolled', async () => {
    render(<SideNav items={items} />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('data-state', 'expanded')

    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }))
    expect(nav).toHaveAttribute('data-state', 'collapsed')

    await userEvent.click(screen.getByRole('button', { name: 'Expand navigation' }))
    expect(nav).toHaveAttribute('data-state', 'expanded')
  })

  it('respects defaultCollapsed', () => {
    render(<SideNav items={items} defaultCollapsed />)
    expect(screen.getByRole('navigation')).toHaveAttribute('data-state', 'collapsed')
    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
  })

  it('adds title attributes to items when collapsed', () => {
    render(<SideNav items={items} defaultCollapsed />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('title', 'Home')
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute('title', 'Settings')
  })

  it('does not change state itself when controlled, but reports the intent', async () => {
    const onCollapsedChange = vi.fn()
    render(<SideNav items={items} collapsed={false} onCollapsedChange={onCollapsedChange} />)
    const nav = screen.getByRole('navigation')

    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }))
    expect(onCollapsedChange).toHaveBeenCalledOnce()
    expect(onCollapsedChange).toHaveBeenCalledWith(true)
    expect(nav).toHaveAttribute('data-state', 'expanded')
  })

  it('syncs the controlled collapsed prop on re-render', () => {
    const { rerender } = render(<SideNav items={items} collapsed={false} />)
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('data-state', 'expanded')

    rerender(<SideNav items={items} collapsed />)
    expect(nav).toHaveAttribute('data-state', 'collapsed')
  })

  it('accepts custom collapse and expand labels', async () => {
    render(<SideNav items={items} collapseLabel="Zuklappen" expandLabel="Aufklappen" />)
    await userEvent.click(screen.getByRole('button', { name: 'Zuklappen' }))
    expect(screen.getByRole('button', { name: 'Aufklappen' })).toBeInTheDocument()
  })
})
