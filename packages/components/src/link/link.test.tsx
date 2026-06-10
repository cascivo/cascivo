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
