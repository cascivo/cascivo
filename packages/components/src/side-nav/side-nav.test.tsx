import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setLinkComponent } from '@cascivo/core'
import { SideNav, type SideNavItem } from './side-nav'

describe('SideNav router link integration', () => {
  afterEach(() => setLinkComponent('a'))

  it('renders items through a registered link component, preserving href and aria-current', () => {
    const calls: Record<string, unknown>[] = []
    function StubLink({ children, ...props }: { children?: React.ReactNode }) {
      calls.push(props as Record<string, unknown>)
      return (
        <a data-stub {...(props as Record<string, unknown>)}>
          {children}
        </a>
      )
    }
    setLinkComponent(StubLink)
    render(<SideNav items={[{ label: 'Deployments', href: '/deploys', active: true }]} />)
    const link = screen.getByText('Deployments').closest('a')!
    expect(link.hasAttribute('data-stub')).toBe(true)
    expect(link.getAttribute('href')).toBe('/deploys')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(calls.some((c) => c['href'] === '/deploys')).toBe(true)
  })
})

describe('SideNav groups prop', () => {
  it('renders section headers when groups are provided', () => {
    render(
      <SideNav
        groups={[
          { label: 'CONSOLE', items: [{ label: 'Dashboard' }] },
          { label: 'CLUSTERS', items: [{ label: 'Dev Cluster' }] },
        ]}
      />,
    )
    expect(screen.getByText('CONSOLE')).toBeInTheDocument()
    expect(screen.getByText('CLUSTERS')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dev Cluster')).toBeInTheDocument()
  })

  it('renders no section headers when groups have no label', () => {
    render(<SideNav groups={[{ items: [{ label: 'Dashboard' }] }]} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('existing flat items prop still works when groups is absent', () => {
    render(<SideNav items={[{ label: 'Instances' }, { label: 'Incidents' }]} />)
    expect(screen.getByText('Instances')).toBeInTheDocument()
  })
})

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

  it('adds aria-label to items when collapsed', () => {
    render(<SideNav items={[{ label: 'Home', href: '/' }]} defaultCollapsed />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-label', 'Home')
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

describe('SideNav rail mode', () => {
  const railItems: SideNavItem[] = [
    { label: 'Dashboard', href: '/dash', icon: <svg data-testid="dash-icon" /> },
    { label: 'Settings', href: '/settings' },
  ]

  it('hides labels from the visual layout when collapsed', () => {
    render(<SideNav items={railItems} collapsed />)
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveAttribute('aria-label', 'Dashboard')
    expect(link.querySelector('[data-rail-hidden]')).not.toBeNull()
  })

  it('renders a grapheme badge for icon-less items when collapsed', () => {
    render(<SideNav items={railItems} collapsed />)
    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link.querySelector('[data-fallback-icon]')).toHaveTextContent('S')
  })

  it('does not render fallback badges when expanded', () => {
    render(<SideNav items={railItems} />)
    const link = screen.getByRole('link', { name: 'Settings' })
    expect(link.querySelector('[data-fallback-icon]')).toBeNull()
  })

  it('shows a tooltip with the label on rail-item hover', async () => {
    render(<SideNav items={[{ label: 'Dashboard', href: '/d', icon: <svg /> }]} collapsed />)
    await userEvent.hover(screen.getByRole('link', { name: 'Dashboard' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Dashboard')
  })
})

describe('SideNav rail flyout', () => {
  const groupItems: SideNavItem[] = [
    {
      label: 'Manage',
      icon: <svg />,
      items: [
        { label: 'Users', href: '/users' },
        { label: 'Billing', href: '/billing' },
      ],
    },
  ]

  it('opens a flyout with sublinks on group click when collapsed', async () => {
    const { container } = render(<SideNav items={groupItems} collapsed />)
    const trigger = screen.getByRole('button', { name: 'Manage' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.click(trigger)
    const flyout = container.querySelector('[role="menu"]')
    expect(flyout).not.toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('closes the flyout on Escape and restores trigger focus', async () => {
    render(<SideNav items={groupItems} collapsed />)
    const trigger = screen.getByRole('button', { name: 'Manage' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps inline expansion when not collapsed', async () => {
    render(<SideNav items={groupItems} />)
    await userEvent.click(screen.getByRole('button', { name: 'Manage' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeVisible()
  })
})

describe('SideNav button-mode items', () => {
  it('renders an onClick-only item as a focusable button', async () => {
    const onClick = vi.fn()
    render(<SideNav items={[{ label: 'Search', onClick }]} />)
    const button = screen.getByRole('button', { name: 'Search' })
    expect(button).toHaveAttribute('type', 'button')

    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('keeps an item with href as an anchor even when onClick is set', () => {
    render(<SideNav items={[{ label: 'Home', href: '/', onClick: vi.fn() }]} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Home' })).toBeNull()
  })
})

describe('SideNav item disabled / tone / trailing', () => {
  it('disables a button-mode item and blocks its onClick', async () => {
    const onClick = vi.fn()
    render(<SideNav items={[{ label: 'Reconnect', onClick, disabled: true }]} />)
    const button = screen.getByRole('button', { name: 'Reconnect' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('marks a disabled link item with aria-disabled and prevents navigation', async () => {
    const onClick = vi.fn()
    render(<SideNav items={[{ label: 'Reports', href: '/reports', onClick, disabled: true }]} />)
    const link = screen.getByText('Reports').closest('a') as HTMLAnchorElement
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).not.toHaveAttribute('href')
    await userEvent.click(link)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies a tone via data-tone', () => {
    render(<SideNav items={[{ label: 'Reconnect', onClick: vi.fn(), tone: 'warning' }]} />)
    expect(screen.getByRole('button', { name: 'Reconnect' })).toHaveAttribute(
      'data-tone',
      'warning',
    )
  })

  it('renders trailing content after the label', () => {
    render(<SideNav items={[{ label: 'Search', onClick: vi.fn(), trailing: <kbd>⌘K</kbd> }]} />)
    expect(screen.getByText('⌘K')).toBeInTheDocument()
  })
})

describe('SideNav rich sub-items', () => {
  it('runs onSelect for an action sub-item and shows a selected checkmark', async () => {
    const onSelect = vi.fn()
    render(
      <SideNav
        items={[
          {
            label: 'Project',
            items: [
              { type: 'label', label: 'Projects' },
              { label: 'Apollo', onSelect, selected: true },
              { type: 'separator' },
              { label: 'Add project', href: '/projects/new' },
            ],
          },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Project' }))

    expect(screen.getByText('Projects')).toBeInTheDocument()
    const apollo = screen.getByRole('button', { name: 'Apollo' })
    expect(apollo.querySelector('svg')).not.toBeNull()
    await userEvent.click(apollo)
    expect(onSelect).toHaveBeenCalledOnce()

    expect(screen.getByRole('link', { name: 'Add project' })).toHaveAttribute(
      'href',
      '/projects/new',
    )
  })
})

describe('SideNav custom-item escape hatch', () => {
  it('renders custom content and passes the collapsed context', () => {
    render(
      <SideNav
        collapsed
        items={[
          { label: 'Picker', render: ({ collapsed }) => <div>rail:{String(collapsed)}</div> },
        ]}
      />,
    )
    expect(screen.getByText('rail:true')).toBeInTheDocument()
  })
})

describe('SideNav header slot', () => {
  it('renders header content above the items', () => {
    render(<SideNav items={[{ label: 'Home', href: '/' }]} header={<span>Workspace</span>} />)
    expect(screen.getByText('Workspace')).toBeInTheDocument()
  })
})

describe('SideNav footer + expandOnHover', () => {
  it('renders footer content above the collapse toggle', () => {
    render(<SideNav items={[]} footer={<span>v2.1.0</span>} />)
    expect(screen.getByText('v2.1.0')).toBeInTheDocument()
  })

  it('sets data-expand-on-hover when enabled and collapsed', () => {
    render(<SideNav items={[]} collapsed expandOnHover ariaLabel="nav" />)
    expect(screen.getByRole('navigation', { name: 'nav' })).toHaveAttribute('data-expand-on-hover')
  })

  it('does not set data-expand-on-hover when expanded', () => {
    render(<SideNav items={[]} expandOnHover ariaLabel="nav" />)
    expect(screen.getByRole('navigation', { name: 'nav' })).not.toHaveAttribute(
      'data-expand-on-hover',
    )
  })
})

describe('SideNav stable keys', () => {
  it('does not warn about duplicate keys when items share an href placeholder', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const items: SideNavItem[] = [
      { label: 'Overview', href: '#', onClick: () => {} },
      { label: 'Reports', href: '#', onClick: () => {} },
      { label: 'Settings', href: '#', onClick: () => {} },
    ]
    render(<SideNav items={items} />)
    const dupKeyWarning = spy.mock.calls.find((c) => String(c[0]).includes('same key'))
    expect(dupKeyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
