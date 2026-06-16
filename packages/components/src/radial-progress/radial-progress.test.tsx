import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RadialProgress } from './radial-progress'

describe('RadialProgress', () => {
  it('renders role="progressbar" with correct aria attributes', () => {
    render(<RadialProgress value={50} />)
    const el = screen.getByRole('progressbar')
    expect(el).toHaveAttribute('aria-valuenow', '50')
    expect(el).toHaveAttribute('aria-valuemin', '0')
    expect(el).toHaveAttribute('aria-valuemax', '100')
  })

  it('default label is the percentage string when value={72}', () => {
    render(<RadialProgress value={72} />)
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('custom children override the default label', () => {
    render(<RadialProgress value={45}>45 GB</RadialProgress>)
    expect(screen.getByText('45 GB')).toBeInTheDocument()
    expect(screen.queryByText('45%')).toBeNull()
  })

  it('value={-10} clamps aria-valuenow to 0', () => {
    render(<RadialProgress value={-10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('value={110} clamps aria-valuenow to 100', () => {
    render(<RadialProgress value={110} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('sets --cascivo-radial-progress inline style to clamped value', () => {
    render(<RadialProgress value={60} />)
    const el = screen.getByRole('progressbar')
    expect((el as HTMLElement).style.getPropertyValue('--cascivo-radial-progress')).toBe('60')
  })

  it('forwards data-variant', () => {
    render(<RadialProgress value={50} variant="success" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-variant', 'success')
  })

  it('forwards data-size', () => {
    render(<RadialProgress value={50} size="lg" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'lg')
  })
})
