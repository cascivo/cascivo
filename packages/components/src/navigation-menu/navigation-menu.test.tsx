import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationMenu, type NavigationMenuItem } from './navigation-menu'

afterEach(cleanup)

function buildItems(): NavigationMenuItem[] {
  return [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', content: <a href="/all">All products</a> },
    { id: 'about', label: 'About', href: '/about' },
  ]
}

describe('NavigationMenu', () => {
  it('renders a navigation landmark with links and a trigger', () => {
    render(<NavigationMenu aria-label="Main" items={buildItems()} />)
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Products' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('moves focus across entries with arrow keys', async () => {
    render(<NavigationMenu aria-label="Main" items={buildItems()} />)
    const home = screen.getByRole('link', { name: 'Home' })
    home.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: 'Products' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('link', { name: 'About' })).toHaveFocus()
  })

  it('opens a flyout panel on click and sets aria-expanded', async () => {
    render(<NavigationMenu aria-label="Main" items={buildItems()} />)
    const trigger = screen.getByRole('button', { name: 'Products' })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')
    expect(panel).not.toBeNull()
    expect(screen.getByText('All products')).toBeInTheDocument()
  })

  it('closes the panel on Escape and restores trigger focus', async () => {
    render(<NavigationMenu aria-label="Main" items={buildItems()} />)
    const trigger = screen.getByRole('button', { name: 'Products' })
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('All products')).not.toBeInTheDocument()
  })
})
