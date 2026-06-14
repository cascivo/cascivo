import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notification } from './notification'

afterEach(cleanup)

describe('Notification', () => {
  it('renders the title and description', () => {
    render(<Notification title="Sync complete" description="Your files are up to date." />)
    expect(screen.getByText('Sync complete')).toBeInTheDocument()
    expect(screen.getByText('Your files are up to date.')).toBeInTheDocument()
  })

  it('uses status role for info and success variants', () => {
    render(<Notification variant="info" title="Info" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    cleanup()
    render(<Notification variant="success" title="Saved" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('uses alert role for warning and error variants', () => {
    render(<Notification variant="warning" title="Heads up" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    cleanup()
    render(<Notification variant="error" title="Failed" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies the variant data attribute', () => {
    render(<Notification variant="warning" title="Warn" />)
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'warning')
  })

  it('renders the actions slot', () => {
    render(
      <Notification
        variant="error"
        title="Upload failed"
        actions={<button type="button">Retry</button>}
      />,
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('renders a dismiss button when dismissible', () => {
    render(<Notification variant="info" title="Closable" dismissible />)
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('renders a dismiss button when onDismiss is provided', () => {
    render(<Notification variant="info" title="Closable" onDismiss={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('does not render a dismiss button by default', () => {
    render(<Notification variant="info" title="Static" />)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
  })

  it('uses a custom dismiss label', () => {
    render(
      <Notification variant="info" title="Closable" dismissible labels={{ dismiss: 'Close it' }} />,
    )
    expect(screen.getByRole('button', { name: 'Close it' })).toBeInTheDocument()
  })

  it('removes the notification and calls onDismiss when dismissed', async () => {
    const onDismiss = vi.fn()
    render(<Notification variant="info" title="Closable" dismissible onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByText('Closable')).not.toBeInTheDocument())
    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce())
  })
})
