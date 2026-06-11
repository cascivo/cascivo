import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HeaderPanel } from './header-panel'

describe('HeaderPanel', () => {
  it('renders children when open', () => {
    const { container } = render(
      <HeaderPanel open onClose={() => {}} label="Notifications">
        <p>3 unread</p>
      </HeaderPanel>,
    )
    expect(screen.getByText('3 unread')).toBeInTheDocument()
    const panel = container.querySelector('[role="region"]')
    expect(panel?.getAttribute('data-state')).toBe('open')
  })

  it('is hidden when open=false', () => {
    const { container } = render(
      <HeaderPanel open={false} onClose={() => {}} label="Notifications">
        <p>3 unread</p>
      </HeaderPanel>,
    )
    const panel = container.querySelector('[role="region"]')
    expect(panel?.getAttribute('data-state')).toBe('closed')
  })

  it('calls onClose on close-button click', async () => {
    const onClose = vi.fn()
    render(
      <HeaderPanel open onClose={onClose} label="Notifications">
        <p>content</p>
      </HeaderPanel>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close panel', hidden: true }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the popover toggle event fires', () => {
    const onClose = vi.fn()
    const { container } = render(
      <HeaderPanel open onClose={onClose} label="Notifications">
        <p>content</p>
      </HeaderPanel>,
    )
    const panel = container.querySelector('[role="region"]')
    panel?.dispatchEvent(new Event('toggle'))
    expect(onClose).toHaveBeenCalled()
  })

  it('accepts a custom close label', () => {
    render(
      <HeaderPanel open onClose={() => {}} label="P" labels={{ close: 'Schließen' }}>
        <p>content</p>
      </HeaderPanel>,
    )
    expect(screen.getByRole('button', { name: 'Schließen', hidden: true })).toBeInTheDocument()
  })

  it('reflects label as aria-label on the region', () => {
    const { container } = render(
      <HeaderPanel open onClose={() => {}} label="My Panel">
        <p>content</p>
      </HeaderPanel>,
    )
    const panel = container.querySelector('[role="region"]')
    expect(panel?.getAttribute('aria-label')).toBe('My Panel')
  })
})
