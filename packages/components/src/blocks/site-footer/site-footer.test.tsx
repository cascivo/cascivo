import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteFooter } from './site-footer'

describe('SiteFooter', () => {
  it('renders a contentinfo footer landmark', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the footer navigation with link columns', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('navigation', { name: /footer/i })).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '#')
  })

  it('renders the current year in the copyright', () => {
    render(<SiteFooter />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(`${year} cascivo`))).toBeInTheDocument()
  })
})
