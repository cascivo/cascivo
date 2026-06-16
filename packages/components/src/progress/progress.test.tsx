import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './progress'

describe('Progress', () => {
  it('renders with value and max when value is provided', () => {
    render(<Progress value={50} aria-label="Loading" />)
    const el = screen.getByRole('progressbar')
    expect(el).toHaveAttribute('value', '50')
    expect(el).toHaveAttribute('max', '100')
  })

  it('renders without value attribute when value is omitted (indeterminate)', () => {
    render(<Progress aria-label="Loading" />)
    const el = screen.getByRole('progressbar')
    expect(el).not.toHaveAttribute('value')
    expect(el).not.toHaveAttribute('max')
  })

  it('applies data-variant attribute', () => {
    render(<Progress value={50} variant="success" aria-label="Done" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-variant', 'success')
  })

  it('applies data-size attribute', () => {
    render(<Progress value={50} size="lg" aria-label="Loading" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'lg')
  })

  it('defaults to primary variant and md size', () => {
    render(<Progress value={50} aria-label="Loading" />)
    const el = screen.getByRole('progressbar')
    expect(el).toHaveAttribute('data-variant', 'primary')
    expect(el).toHaveAttribute('data-size', 'md')
  })

  it('forwards aria-label', () => {
    render(<Progress aria-label="Uploading file" />)
    expect(screen.getByRole('progressbar', { name: 'Uploading file' })).toBeInTheDocument()
  })
})
