import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from './progress-bar'

describe('ProgressBar', () => {
  it('exposes determinate progress via aria attributes', () => {
    render(<ProgressBar value={40} label="Uploading" />)
    const bar = screen.getByRole('progressbar', { name: 'Uploading' })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
  })

  it('respects a custom max', () => {
    render(<ProgressBar value={5} max={20} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemax', '20')
    expect(bar).toHaveAttribute('aria-valuenow', '5')
  })

  it('clamps value to the 0..max range', () => {
    render(<ProgressBar value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('drives the fill width via an inline custom property', () => {
    const { container } = render(<ProgressBar value={30} />)
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(fill).toBeInstanceOf(HTMLElement)
    expect((fill as HTMLElement).style.getPropertyValue('--cascivo-progress-value')).toBe('30%')
  })

  it('is indeterminate when value is omitted', () => {
    const { container } = render(<ProgressBar label="Processing" />)
    const bar = screen.getByRole('progressbar', { name: 'Processing' })
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(container.firstElementChild).toHaveAttribute('data-state', 'indeterminate')
  })

  it('renders label and helper text', () => {
    render(<ProgressBar value={10} label="Uploading" helperText="3 of 10 files" />)
    expect(screen.getByText('Uploading')).toBeInTheDocument()
    expect(screen.getByText('3 of 10 files')).toBeInTheDocument()
  })

  it('applies status and size data attributes', () => {
    const { container } = render(<ProgressBar value={10} status="error" size="sm" />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('data-status', 'error')
    expect(root).toHaveAttribute('data-size', 'sm')
  })

  it('defaults to active status and md size without indeterminate state', () => {
    const { container } = render(<ProgressBar value={10} />)
    const root = container.firstElementChild
    expect(root).toHaveAttribute('data-status', 'active')
    expect(root).toHaveAttribute('data-size', 'md')
    expect(root).not.toHaveAttribute('data-state')
  })

  it('shows a success glyph next to the label', () => {
    render(<ProgressBar value={100} status="success" label="Upload complete" />)
    const label = screen.getByText('Upload complete')
    expect(label).toHaveTextContent('✓')
  })

  it('shows an error glyph next to the label', () => {
    render(<ProgressBar value={20} status="error" label="Upload failed" />)
    const label = screen.getByText('Upload failed')
    expect(label).toHaveTextContent('✕')
  })

  it('does not render a glyph for active status', () => {
    render(<ProgressBar value={20} label="Uploading" />)
    expect(screen.getByText('Uploading')).not.toHaveTextContent('✓')
  })
})
