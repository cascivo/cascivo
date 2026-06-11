import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Switcher } from './switcher'

describe('Switcher', () => {
  it('renders app links with aria-current on the active one', () => {
    render(
      <Switcher
        items={[
          { label: 'Console', href: '/console', active: true },
          { label: 'Billing', href: '/billing' },
          { divider: true },
          { label: 'Docs', href: '/docs' },
        ]}
      />,
    )
    const list = screen.getByRole('list', { name: 'Switch application' })
    expect(list).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Console' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Billing' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('accepts a custom label', () => {
    render(<Switcher items={[{ label: 'App', href: '/app' }]} label="Switch product" />)
    expect(screen.getByRole('list', { name: 'Switch product' })).toBeInTheDocument()
  })

  it('renders icons when provided', () => {
    render(
      <Switcher
        items={[{ label: 'Console', href: '/console', icon: <svg data-testid="icon" /> }]}
      />,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('marks active item with data-state', () => {
    render(<Switcher items={[{ label: 'Console', href: '/console', active: true }]} />)
    expect(screen.getByRole('link', { name: 'Console' })).toHaveAttribute('data-state', 'active')
  })
})
