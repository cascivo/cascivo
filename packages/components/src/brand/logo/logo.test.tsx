import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './logo'

describe('Logo', () => {
  it('announces the bare mark as an image named cascivo', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: 'cascivo' })).toBeInTheDocument()
  })

  it('renders one closed path and no accent by default', () => {
    const { container } = render(<Logo />)
    expect(container.querySelectorAll('path')).toHaveLength(1)
    expect(container.querySelector('rect')).toBeNull()
  })

  it('fills the notch only for the accent variants', () => {
    const { container: accent } = render(<Logo variant="mark-accent" />)
    expect(accent.querySelector('rect')).toBeInTheDocument()
    const { container: nav } = render(<Logo variant="nav" />)
    expect(nav.querySelector('rect')).toBeNull()
  })

  it('hides the mark from assistive tech in a lockup so the name is announced once', () => {
    render(<Logo variant="horizontal" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('cascivo')).toBeInTheDocument()
  })

  it('defaults to an 18px mark for nav and 32px otherwise', () => {
    const { container: nav } = render(<Logo variant="nav" />)
    expect(nav.querySelector('svg')).toHaveAttribute('width', '18')
    const { container: mark } = render(<Logo />)
    expect(mark.querySelector('svg')).toHaveAttribute('width', '32')
  })

  it('clamps below the 16px floor, where the notch closes optically', () => {
    const { container } = render(<Logo size={8} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '16')
  })

  it('keeps the size hook when the caller passes its own style', () => {
    const { container } = render(<Logo size={40} style={{ opacity: 0.5 }} />)
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--cascivo-logo-size')).toBe('40px')
    expect(root.style.opacity).toBe('0.5')
  })

  it('exposes the variant as a styling hook', () => {
    const { container } = render(<Logo variant="stacked" />)
    expect(container.querySelector('[data-cascivo-logo="stacked"]')).toBeInTheDocument()
  })
})
