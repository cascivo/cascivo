import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { InlineLoading } from './inline-loading'

afterEach(cleanup)

describe('InlineLoading', () => {
  it('renders with the status role and polite live region', () => {
    render(<InlineLoading status="active" />)
    const el = screen.getByRole('status')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('applies the status data attribute for each status', () => {
    for (const status of ['inactive', 'active', 'finished', 'error'] as const) {
      render(<InlineLoading status={status} />)
      expect(screen.getByRole('status')).toHaveAttribute('data-status', status)
      cleanup()
    }
  })

  it('shows a default label for active status', () => {
    render(<InlineLoading status="active" />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('shows a default label for finished status', () => {
    render(<InlineLoading status="finished" />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })

  it('shows a default label for error status', () => {
    render(<InlineLoading status="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders no label for inactive status by default', () => {
    render(<InlineLoading status="inactive" />)
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('overrides the label via the label prop', () => {
    render(<InlineLoading status="finished" label="Saved" />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.queryByText('Loaded')).not.toBeInTheDocument()
  })

  it('overrides the label via the per-status labels map', () => {
    render(<InlineLoading status="error" labels={{ error: 'Save failed' }} />)
    expect(screen.getByText('Save failed')).toBeInTheDocument()
  })

  it('renders a spinner for the active status', () => {
    const { container } = render(<InlineLoading status="active" />)
    // The nested Spinner renders a span with the spinner module class.
    expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument()
  })

  it('renders an svg icon for finished and error statuses', () => {
    const { container } = render(<InlineLoading status="finished" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    cleanup()
    const { container: errorContainer } = render(<InlineLoading status="error" />)
    expect(errorContainer.querySelector('svg')).toBeInTheDocument()
  })
})
