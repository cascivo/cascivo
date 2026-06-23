import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionSheet, type ActionSheetAction } from './action-sheet'

afterEach(cleanup)

function actions(overrides: Partial<ActionSheetAction>[] = []): ActionSheetAction[] {
  const base: ActionSheetAction[] = [
    { label: 'Share', onSelect: vi.fn() },
    { label: 'Edit', onSelect: vi.fn() },
    { label: 'Delete', onSelect: vi.fn(), destructive: true },
  ]
  return base.map((a, i) => ({ ...a, ...overrides[i] }))
}

describe('ActionSheet', () => {
  it('is not in the document when closed', () => {
    render(<ActionSheet actions={actions()} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders a labelled menu with an item per action plus Cancel', () => {
    render(<ActionSheet open title="Photo" actions={actions()} />)
    const menu = screen.getByRole('menu')
    expect(menu).toHaveAccessibleName('Photo')
    // 3 actions + cancel
    expect(screen.getAllByRole('menuitem')).toHaveLength(4)
    expect(screen.getByRole('menuitem', { name: /cancel/i })).toBeInTheDocument()
  })

  it('falls back to a built-in label when no title is given', () => {
    render(<ActionSheet open actions={actions()} />)
    expect(screen.getByRole('menu')).toHaveAccessibleName('Actions')
  })

  it('invokes the action and closes on selection', async () => {
    const onOpenChange = vi.fn()
    const acts = actions()
    render(<ActionSheet open actions={acts} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(acts[1]!.onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not invoke a disabled action', async () => {
    const acts = actions([{}, { disabled: true }])
    const onOpenChange = vi.fn()
    render(<ActionSheet open actions={acts} onOpenChange={onOpenChange} />)
    const item = screen.getByRole('menuitem', { name: 'Edit' })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(item)
    expect(acts[1]!.onSelect).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('marks destructive actions', () => {
    render(<ActionSheet open actions={actions()} />)
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('data-destructive', '')
  })

  it('closes via Cancel without selecting', async () => {
    const acts = actions()
    const onOpenChange = vi.fn()
    render(<ActionSheet open actions={acts} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('menuitem', { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(acts[0]!.onSelect).not.toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(<ActionSheet open actions={actions()} onOpenChange={onOpenChange} />)
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('moves focus between items with arrow keys (roving, wraps)', async () => {
    const user = userEvent.setup()
    render(<ActionSheet open actions={actions()} />)
    const items = screen.getAllByRole('menuitem')
    items[0]!.focus()
    expect(items[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(items[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(items[3]).toHaveFocus() // cancel
    await user.keyboard('{ArrowDown}') // wraps to first
    expect(items[0]).toHaveFocus()
  })
})
