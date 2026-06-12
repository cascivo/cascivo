import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Status } from './status'

describe('Status', () => {
  it('renders the label children', () => {
    render(<Status status="success">Operational</Status>)
    expect(screen.getByText('Operational')).toBeInTheDocument()
  })

  it('defaults to neutral status', () => {
    render(<Status data-testid="status">Unknown</Status>)
    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'neutral')
  })

  it('applies the status data attribute', () => {
    render(
      <Status status="error" data-testid="status">
        Down
      </Status>,
    )
    expect(screen.getByTestId('status')).toHaveAttribute('data-status', 'error')
  })

  it('renders a decorative dot hidden from assistive tech', () => {
    const { container } = render(<Status status="info">Deploying</Status>)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('sets data-pulse only when pulse is true', () => {
    const { rerender } = render(
      <Status status="success" pulse data-testid="status">
        Live
      </Status>,
    )
    expect(screen.getByTestId('status')).toHaveAttribute('data-pulse', '')
    rerender(
      <Status status="success" data-testid="status">
        Live
      </Status>,
    )
    expect(screen.getByTestId('status')).not.toHaveAttribute('data-pulse')
  })

  it('merges className and forwards props', () => {
    render(
      <Status className="custom" data-testid="status">
        x
      </Status>,
    )
    expect(screen.getByTestId('status')).toHaveClass('custom')
  })
})
