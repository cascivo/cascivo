import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

function setup() {
  render(
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="password">Password panel</TabsContent>
    </Tabs>,
  )
}

describe('Tabs', () => {
  it('shows the default panel', () => {
    setup()
    expect(screen.getByText('Account panel')).toBeInTheDocument()
    expect(screen.queryByText('Password panel')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches panels on click', async () => {
    setup()
    await userEvent.click(screen.getByRole('tab', { name: 'Password' }))
    expect(screen.getByText('Password panel')).toBeInTheDocument()
    expect(screen.queryByText('Account panel')).not.toBeInTheDocument()
  })

  it('moves between tabs with arrow keys', async () => {
    setup()
    const account = screen.getByRole('tab', { name: 'Account' })
    account.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Password panel')).toBeInTheDocument()
  })

  it('wires up aria-controls and aria-labelledby', () => {
    setup()
    const tab = screen.getByRole('tab', { name: 'Account' })
    const panel = screen.getByRole('tabpanel')
    expect(tab.getAttribute('aria-controls')).toBe(panel.getAttribute('id'))
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.getAttribute('id'))
  })
})

describe('TabsTrigger asChild — URL-driven tabs', () => {
  it('renders the slotted element while keeping every tab behaviour', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <a href="/projects/1/overview">Overview</a>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <a href="/projects/1/settings">Settings</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )

    const overview = screen.getByRole('tab', { name: 'Overview' })
    // A real anchor: this is the whole point — middle-click, cmd-click and crawlable hrefs
    // all come from the element, not from an onClick handler.
    expect(overview.tagName).toBe('A')
    expect(overview.getAttribute('href')).toBe('/projects/1/overview')

    // …and it is still a tab.
    expect(overview.getAttribute('aria-selected')).toBe('true')
    expect(overview.getAttribute('data-state')).toBe('active')
    expect(overview.getAttribute('tabindex')).toBe('0')
    expect(overview.getAttribute('aria-controls')).toBeTruthy()

    const settings = screen.getByRole('tab', { name: 'Settings' })
    expect(settings.getAttribute('aria-selected')).toBe('false')
    expect(settings.getAttribute('tabindex')).toBe('-1')
  })

  it('never puts `type` or `disabled` on a slotted anchor', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" asChild disabled>
            <a href="/a">A</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const tab = screen.getByRole('tab', { name: 'A' })
    // `type` on an <a> means something else entirely, and `disabled` is not a valid
    // anchor attribute — it would be dropped silently, leaving the tab fully operable.
    expect(tab.hasAttribute('type')).toBe(false)
    expect(tab.hasAttribute('disabled')).toBe(false)
    expect(tab.getAttribute('aria-disabled')).toBe('true')
  })

  it('still renders a real <button> without asChild', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const tab = screen.getByRole('tab', { name: 'A' })
    expect(tab.tagName).toBe('BUTTON')
    expect(tab.getAttribute('type')).toBe('button')
  })
})
