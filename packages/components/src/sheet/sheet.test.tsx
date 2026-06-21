import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './sheet'

describe('Sheet', () => {
  it('renders children when open', () => {
    const { container } = render(
      <Sheet open={true} onClose={() => {}} title="Settings">
        <p>Sheet content</p>
      </Sheet>,
    )
    expect(screen.getByText('Sheet content')).toBeDefined()
    const el = container.querySelector('[role="dialog"]')
    expect(el?.getAttribute('data-state')).toBe('open')
  })

  it('is hidden when open=false', () => {
    const { container } = render(
      <Sheet open={false} onClose={() => {}} title="Settings">
        <p>Sheet content</p>
      </Sheet>,
    )
    const el = container.querySelector('[role="dialog"]')
    expect(el?.getAttribute('data-state')).toBe('closed')
  })

  it('calls onClose on close button click', async () => {
    const onClose = vi.fn()
    render(
      <Sheet open={true} onClose={onClose} title="Settings">
        <p>Content</p>
      </Sheet>,
    )
    // Close button has aria-label containing "close" (from i18n "Close panel")
    const closeBtn = screen.getByRole('button', { name: /close/i, hidden: true })
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders with correct side', () => {
    const { container } = render(
      <Sheet open={true} onClose={() => {}} title="Nav" side="start">
        <p>Nav content</p>
      </Sheet>,
    )
    const el = container.querySelector('[role="dialog"]')
    expect(el?.getAttribute('data-side')).toBe('start')
  })

  it('labels the dialog via aria-labelledby when a title is given', () => {
    const { container } = render(
      <Sheet open={true} onClose={() => {}} title="Settings">
        <p>Content</p>
      </Sheet>,
    )
    const el = container.querySelector('[role="dialog"]')
    const labelId = el?.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(container.querySelector(`#${labelId}`)?.textContent).toBe('Settings')
  })

  it('omits the title and aria-labelledby when no title is given', () => {
    const { container } = render(
      <Sheet open={true} onClose={() => {}}>
        <p>Content</p>
      </Sheet>,
    )
    const el = container.querySelector('[role="dialog"]')
    expect(el?.getAttribute('aria-labelledby')).toBeNull()
    // close affordance still renders
    expect(screen.getByRole('button', { name: /close/i, hidden: true })).toBeDefined()
  })
})
