import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './spinner'

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('uses default accessible label', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('accepts a custom label', () => {
    render(<Spinner label="Fetching data" />)
    expect(screen.getByLabelText('Fetching data')).toBeInTheDocument()
  })

  it('applies size data attribute', () => {
    render(<Spinner size="lg" />)
    expect(screen.getByRole('status')).toHaveAttribute('data-size', 'lg')
  })
})
