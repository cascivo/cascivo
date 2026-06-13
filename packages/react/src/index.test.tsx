import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, Button, Kbd, Spinner } from './index'

describe('@cascivo/react', () => {
  it('renders Button from the bundled entry', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders Badge with variant attribute', () => {
    render(<Badge variant="success">Active</Badge>)
    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success')
  })

  it('renders Kbd and Spinner', () => {
    render(
      <>
        <Kbd>Esc</Kbd>
        <Spinner label="Loading" />
      </>,
    )
    expect(screen.getByText('Esc')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
