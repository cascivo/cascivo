import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies variant data attribute', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success')
  })

  it('applies size data attribute', () => {
    render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small')).toHaveAttribute('data-size', 'sm')
  })

  it('defaults to md size', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toHaveAttribute('data-size', 'md')
  })
})
