import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Link } from './link'

describe('Link', () => {
  it('renders an anchor with href and children', () => {
    render(<Link href="/docs">Docs</Link>)
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('href', '/docs')
  })

  it('applies default variant and size data attributes', () => {
    render(<Link href="/docs">Docs</Link>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('data-variant', 'standalone')
    expect(link).toHaveAttribute('data-size', 'md')
  })

  it('applies inline variant data attribute', () => {
    render(
      <Link variant="inline" href="/docs">
        Docs
      </Link>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('data-variant', 'inline')
  })

  it('applies size data attribute', () => {
    render(
      <Link size="lg" href="/docs">
        Docs
      </Link>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('data-size', 'lg')
  })

  it('adds target, rel, and data-external when external', () => {
    render(
      <Link external href="https://example.com">
        Example
      </Link>,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveAttribute('data-external')
  })

  it('does not add target or rel by default', () => {
    render(<Link href="/docs">Docs</Link>)
    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
    expect(link).not.toHaveAttribute('data-external')
  })

  it('merges custom className', () => {
    render(
      <Link href="/docs" className="custom">
        Docs
      </Link>,
    )
    expect(screen.getByRole('link')).toHaveClass('custom')
  })
})

describe('Link asChild — the router-link path', () => {
  it('renders the child element with cascivo link styling instead of its own anchor', () => {
    render(
      <Link asChild variant="inline" size="lg">
        <a href="/projects/alpha" data-testid="router-link">
          alpha
        </a>
      </Link>,
    )
    const links = screen.getAllByRole('link')
    // Exactly one anchor — asChild must not nest a second one.
    expect(links).toHaveLength(1)
    const link = links[0]!
    expect(link).toHaveAttribute('data-testid', 'router-link')
    expect(link).toHaveAttribute('href', '/projects/alpha')
    expect(link).toHaveAttribute('data-variant', 'inline')
    expect(link).toHaveAttribute('data-size', 'lg')
    expect(link.className).not.toBe('')
  })

  it('merges the child className with cascivo’s', () => {
    render(
      <Link asChild>
        <a href="/x" className="app-link">
          x
        </a>
      </Link>,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('app-link')
    expect(link.className.split(' ').length).toBeGreaterThan(1)
  })

  it('still applies external affordances through the child', () => {
    render(
      <Link asChild external>
        <a href="https://example.com">Example</a>
      </Link>,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveAttribute('data-external')
  })
})
