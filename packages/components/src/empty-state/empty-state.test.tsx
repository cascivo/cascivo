import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders the title as a heading', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByRole('heading', { level: 3, name: 'No results' })).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(<EmptyState title="No results" description="Try adjusting your filters." />)
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument()
  })

  it('does not render a description when omitted', () => {
    const { container } = render(<EmptyState title="No results" />)
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })

  it('renders the icon in an aria-hidden wrapper', () => {
    render(<EmptyState title="No results" icon={<svg data-testid="icon" />} />)
    const icon = screen.getByTestId('icon')
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the action slot and forwards interaction', async () => {
    const handler = vi.fn()
    render(
      <EmptyState
        title="No documents yet"
        action={
          <button type="button" onClick={handler}>
            New document
          </button>
        }
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'New document' }))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('applies the size data attribute', () => {
    const { container } = render(<EmptyState title="No results" size="lg" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'lg')
  })

  it('defaults to md size', () => {
    const { container } = render(<EmptyState title="No results" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('merges a custom className', () => {
    const { container } = render(<EmptyState title="No results" className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })
})
