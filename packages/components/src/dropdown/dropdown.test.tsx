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
