import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlertDialog } from './alert-dialog'

describe('AlertDialog', () => {
  it('shows on open=true', () => {
    render(
      <AlertDialog
        open={true}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByRole('alertdialog')).toBeDefined()
    expect(screen.getByRole('alertdialog').getAttribute('data-state')).toBe('open')
  })

  it('is hidden when open=false', () => {
    render(
      <AlertDialog
        open={false}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByRole('alertdialog').getAttribute('data-state')).toBe('closed')
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
