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
