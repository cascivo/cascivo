import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from './dropdown'

const items = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Delete', value: 'delete', disabled: true },
]

function setup(onSelect = vi.fn()) {
  render(
    <Dropdown trigger={<button type="button">Actions</button>} items={items} onSelect={onSelect} />,
  )
  return onSelect
}

describe('Dropdown', () => {
  it('renders the trigger with menu semantics', () => {
    setup()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens on trigger click', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('selects an item and closes', async () => {
    const onSelect = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onSelect).toHaveBeenCalledWith('edit')
    await waitFor(() => expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed'))
  })

  it('does not select a disabled item', async () => {
    const onSelect = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('navigates with the keyboard and selects with Enter', async () => {
    const onSelect = setup()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onSelect).toHaveBeenCalledWith('duplicate')
  })

  it('closes on Escape', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.getByRole('menu')).toHaveAttribute('data-state', 'closed'))
  })
})

/**
 * A separator must never consume a selectable row.
 *
 * `separator: true` on a data-carrying entry renders ONLY a rule and drops the entry's
 * label, value and icon. An adopter lost a "Log out" item to it with no type error and no
 * warning, and found it only because a smoke test counted rows (2026-08-22 report item 9).
 * The `{ kind: 'separator' }` member makes the intent unambiguous and cannot carry data.
 */
describe('Dropdown separators', () => {
  it('renders every item alongside a standalone { kind: "separator" }', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown
        trigger={<button>Open</button>}
        items={[
          { label: 'Account settings', value: 'settings' },
          { label: 'Command menu', value: 'palette' },
          { kind: 'separator' },
          { label: 'Log out', value: 'logout' },
        ]}
      />,
    )
    await user.click(screen.getByText('Open'))
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('separator')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeTruthy()
  })

  it('skips a standalone separator in keyboard navigation and selection', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <Dropdown
        trigger={<button>Open</button>}
        items={[
          { label: 'First', value: 'first' },
          { kind: 'separator' },
          { label: 'Last', value: 'last' },
        ]}
        onSelect={onSelect}
      />,
    )
    await user.click(screen.getByText('Open'))
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('last')
  })
})
