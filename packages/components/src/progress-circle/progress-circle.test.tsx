import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressCircle } from './progress-circle'

describe('ProgressCircle', () => {
  it('renders a progressbar with value semantics', () => {
    render(<ProgressCircle value={40} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
  })

  it('respects a custom max', () => {
    render(<ProgressCircle value={3} max={8} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemax', '8')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
  })

  it('clamps values outside [0, max]', () => {
    const { rerender } = render(<ProgressCircle value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    rerender(<ProgressCircle value={-5} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('uses the label as the accessible name', () => {
    render(<ProgressCircle value={50} label="Upload progress" />)
    expect(screen.getByRole('progressbar', { name: 'Upload progress' })).toBeInTheDocument()
  })

  it('shows the rounded percentage only when showValue is set', () => {
    const { rerender } = render(<ProgressCircle value={1} max={3} showValue />)
    expect(screen.getByText('33%')).toBeInTheDocument()
    rerender(<ProgressCircle value={1} max={3} />)
    expect(screen.queryByText('33%')).not.toBeInTheDocument()
  })

  it('defaults to md size and applies the size data attribute', () => {
    const { rerender } = render(<ProgressCircle value={10} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'md')
    rerender(<ProgressCircle value={10} size="lg" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'lg')
  })

  it('merges className', () => {
    render(<ProgressCircle value={10} className="custom" />)
    expect(screen.getByRole('progressbar')).toHaveClass('custom')
  })
})
