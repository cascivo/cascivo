import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header, type HeaderLink } from './header'

const links: HeaderLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Components', href: '/components', active: true },
  { label: 'Themes', href: '/themes' },
]

describe('Header', () => {
  it('renders a banner landmark', () => {
    render(<Header brand="cascivo" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders the brand slot', () => {
    render(<Header brand={<a href="/">cascade</a>} />)
    expect(screen.getByRole('link', { name: 'cascade' })).toHaveAttribute('href', '/')
  })

  it('renders primary navigation with aria-label "Main"', () => {
    render(<Header links={links} />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('does not render a nav when no links are given', () => {
    render(<Header brand="cascivo" />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('marks the active link with aria-current and data-state', () => {
    render(<Header links={links} />)
    const active = screen.getByRole('link', { name: 'Components' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(active).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('link', { name: 'Docs' })).not.toHaveAttribute('aria-current')
  })

  it('renders the actions slot', () => {
    render(<Header actions={<button type="button">Sign in</button>} />)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('sets data-sticky when sticky', () => {
    render(<Header sticky brand="cascivo" />)
    expect(screen.getByRole('banner')).toHaveAttribute('data-sticky', 'true')
  })

  it('omits data-sticky by default', () => {
    render(<Header brand="cascivo" />)
    expect(screen.getByRole('banner')).not.toHaveAttribute('data-sticky')
  })

  it('merges className', () => {
    render(<Header brand="cascivo" className="custom" />)
    expect(screen.getByRole('banner')).toHaveClass('custom')
  })
})
