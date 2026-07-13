import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlertDialog } from './alert-dialog'

describe('AlertDialog', () => {
  it('shows on open=true', () => {
    const { container } = render(
      <AlertDialog
        open={true}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    // jsdom hides popover elements from accessibility tree; query by attribute
    const el = container.querySelector('[role="alertdialog"]')
    expect(el).not.toBeNull()
    expect(el?.getAttribute('data-state')).toBe('open')
  })

  it('is hidden when open=false', () => {
    const { container } = render(
      <AlertDialog
        open={false}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    const el = container.querySelector('[role="alertdialog"]')
    expect(el?.getAttribute('data-state')).toBe('closed')
  })

  it('calls onCancel on cancel button click', async () => {
    const onCancel = vi.fn()
    render(
      <AlertDialog
        open={true}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    )
    await userEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onConfirm on confirm button click', async () => {
    const onConfirm = vi.fn()
    render(
      <AlertDialog
        open={true}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    )
    await userEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('wires aria to the rendered title/description with unique ids per instance', () => {
    const { container } = render(
      <>
        <AlertDialog
          open
          title="Delete A"
          description="Desc A"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
        <AlertDialog
          open
          title="Delete B"
          description="Desc B"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </>,
    )
    const dialogs = container.querySelectorAll('[role="alertdialog"]')
    expect(dialogs).toHaveLength(2)
    const [a, b] = Array.from(dialogs)
    // Each dialog's aria targets resolve to its own title/description.
    expect(document.getElementById(a!.getAttribute('aria-labelledby')!)).toHaveTextContent(
      'Delete A',
    )
    expect(document.getElementById(b!.getAttribute('aria-labelledby')!)).toHaveTextContent(
      'Delete B',
    )
    // Ids are unique across instances (no duplicate-id aria breakage).
    const ids = [
      a!.getAttribute('aria-labelledby'),
      a!.getAttribute('aria-describedby'),
      b!.getAttribute('aria-labelledby'),
      b!.getAttribute('aria-describedby'),
    ]
    expect(new Set(ids).size).toBe(4)
  })

  it('supports custom labels', () => {
    render(
      <AlertDialog
        open={true}
        title="Archive?"
        description="This will archive the item."
        onConfirm={() => {}}
        onCancel={() => {}}
        labels={{ confirm: 'Archive', cancel: 'Keep' }}
      />,
    )
    expect(screen.getByText('Archive')).toBeDefined()
    expect(screen.getByText('Keep')).toBeDefined()
  })
})
