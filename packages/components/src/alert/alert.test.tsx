import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert } from './alert'

describe('Alert', () => {
  it('renders title and content', () => {
    render(<Alert title="Heads up">Body text</Alert>)
    expect(screen.getByText('Heads up')).toBeInTheDocument()
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })

  it('uses status role for non-urgent variants', () => {
    render(<Alert variant="info">Info</Alert>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('uses alert role for urgent variants', () => {
    render(<Alert variant="destructive">Error</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies the variant data attribute', () => {
    render(<Alert variant="warning">Warn</Alert>)
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'warning')
  })

  it('dismisses and calls onDismiss when the close button is clicked', async () => {
    const onDismiss = vi.fn()
    render(
      <Alert variant="info" dismissible onDismiss={onDismiss}>
        Closable
      </Alert>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(screen.queryByText('Closable')).not.toBeInTheDocument()
  })

  it('renders the action button when an action is provided', () => {
    render(
      <Alert variant="warning" action={{ label: 'Update now', onClick: vi.fn() }}>
        A new version is ready.
      </Alert>,
    )
    expect(screen.getByRole('button', { name: 'Update now' })).toBeInTheDocument()
  })

  it('does not render an action button when no action is provided', () => {
    render(<Alert variant="info">No action</Alert>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls the action onClick when the action button is clicked', async () => {
    const onClick = vi.fn()
    render(
      <Alert variant="info" action={{ label: 'Retry', onClick }}>
        Failed to load.
      </Alert>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
