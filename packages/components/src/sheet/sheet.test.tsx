import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Sheet } from './sheet'

describe('Sheet', () => {
  it('renders children when open', () => {
    render(
      <Sheet open={true} onClose={() => {}} title="Settings">
        <p>Sheet content</p>
      </Sheet>,
    )
    expect(screen.getByText('Sheet content')).toBeDefined()
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('open')
  })

  it('is hidden when open=false', () => {
    render(
      <Sheet open={false} onClose={() => {}} title="Settings">
        <p>Sheet content</p>
      </Sheet>,
    )
    expect(screen.getByRole('dialog').getAttribute('data-state')).toBe('closed')
  })

  it('calls onClose on close button click', async () => {
    const onClose = vi.fn()
    render(
      <Sheet open={true} onClose={onClose} title="Settings">
        <p>Content</p>
      </Sheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders with correct side', () => {
    render(
      <Sheet open={true} onClose={() => {}} title="Nav" side="start">
        <p>Nav content</p>
      </Sheet>,
    )
    expect(screen.getByRole('dialog').getAttribute('data-side')).toBe('start')
  })
})
