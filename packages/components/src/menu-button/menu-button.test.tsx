import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MenuButton } from './menu-button'

afterEach(cleanup)

// jsdom lacks CSS anchor positioning, so useAnchorPosition's fallback marks the freshly
// mounted floating element visibility:hidden until it computes a position. The element is
// fully present in the DOM, so role queries for the open menu pass { hidden: true }.
const items = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', disabled: true },
]

describe('MenuButton', () => {
  it('renders the trigger with the given label and is closed by default', () => {
    const { getByRole, queryByRole } = render(<MenuButton label="Actions" items={items} />)
    const trigger = getByRole('button', { name: 'Actions' })
    expect(trigger).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(queryByRole('menu', { hidden: true })).toBeNull()
  })

  it('opens the menu on trigger click and reflects aria-expanded', () => {
    const { getByRole, getByText } = render(<MenuButton label="Actions" items={items} />)
    const trigger = getByRole('button', { name: 'Actions' })
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(getByRole('menu', { hidden: true })).toBeTruthy()
    expect(getByText('Edit')).toBeTruthy()
  })

  it('toggles closed on a second trigger click', () => {
    const { getByRole, queryByRole } = render(<MenuButton label="Actions" items={items} />)
    const trigger = getByRole('button', { name: 'Actions' })
    fireEvent.click(trigger)
    expect(queryByRole('menu', { hidden: true })).toBeTruthy()
    fireEvent.click(trigger)
    expect(queryByRole('menu', { hidden: true })).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('calls onSelect and closes when an enabled item is clicked', () => {
    const onSelect = vi.fn()
    const { getByRole, getByText, queryByRole } = render(
      <MenuButton label="Actions" items={[{ id: 'edit', label: 'Edit', onSelect }]} />,
    )
    fireEvent.click(getByRole('button', { name: 'Actions' }))
    fireEvent.click(getByText('Edit'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(queryByRole('menu', { hidden: true })).toBeNull()
  })

  it('does not call onSelect for a disabled item', () => {
    const onSelect = vi.fn()
    const { getByRole, getByText } = render(
      <MenuButton
        label="Actions"
        items={[{ id: 'delete', label: 'Delete', onSelect, disabled: true }]}
      />,
    )
    fireEvent.click(getByRole('button', { name: 'Actions' }))
    fireEvent.click(getByText('Delete'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('opens on ArrowDown from the trigger', () => {
    const { getByRole } = render(<MenuButton label="Actions" items={items} />)
    const trigger = getByRole('button', { name: 'Actions' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(getByRole('menu', { hidden: true })).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes on Escape from a menu item', () => {
    const { getByRole, getByText, queryByRole } = render(
      <MenuButton label="Actions" items={items} />,
    )
    fireEvent.click(getByRole('button', { name: 'Actions' }))
    const item = getByText('Edit')
    fireEvent.keyDown(item, { key: 'Escape' })
    expect(queryByRole('menu', { hidden: true })).toBeNull()
  })

  it('does not open when disabled', () => {
    const { getByRole, queryByRole } = render(<MenuButton label="Actions" items={items} disabled />)
    fireEvent.click(getByRole('button', { name: 'Actions' }))
    expect(queryByRole('menu', { hidden: true })).toBeNull()
  })
})
