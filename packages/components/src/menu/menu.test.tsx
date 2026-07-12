import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from './menu'

describe('Menu', () => {
  it('opens on trigger click', async () => {
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </Menu>,
    )
    // jsdom hides popover elements from accessibility tree; query directly
    const panel = container.querySelector('[role="menu"]')
    expect(panel?.getAttribute('data-state')).toBe('closed')
    await userEvent.click(screen.getByText('Actions'))
    expect(panel?.getAttribute('data-state')).toBe('open')
  })

  it('calls onSelect and closes on item click', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={onSelect}>Edit</MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    await userEvent.click(screen.getByText('Edit'))
    expect(onSelect).toHaveBeenCalledOnce()
    const panel = container.querySelector('[role="menu"]')
    expect(panel?.getAttribute('data-state')).toBe('closed')
  })

  it('navigates items with arrow keys', async () => {
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    const editItem = screen.getByText('Edit')
    editItem.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByText('Delete')).toHaveFocus()
  })

  it('arrow navigation skips disabled items and separators', async () => {
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}} disabled>
          Duplicate
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    screen.getByText('Edit').focus()
    await userEvent.keyboard('{ArrowDown}')
    // Skips the disabled "Duplicate" and the separator, landing on "Delete".
    expect(screen.getByText('Delete')).toHaveFocus()
  })

  it('Home/End jump to first/last enabled item and ArrowUp wraps', async () => {
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}}>Copy</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    screen.getByText('Edit').focus()
    await userEvent.keyboard('{End}')
    expect(screen.getByText('Delete')).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByText('Edit')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByText('Delete')).toHaveFocus() // wraps to last
  })

  it('type-to-select focuses the first item matching the typed characters', async () => {
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
        <MenuItem onSelect={() => {}}>Duplicate</MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    screen.getByText('Edit').focus()
    await userEvent.keyboard('du')
    expect(screen.getByText('Duplicate')).toHaveFocus()
  })

  it('renders separator', () => {
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={() => {}}>Edit</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => {}}>Delete</MenuItem>
      </Menu>,
    )
    expect(container.querySelector('[role="separator"]')).toBeDefined()
  })

  it('disabled item does not call onSelect', async () => {
    const onSelect = vi.fn()
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuItem onSelect={onSelect} disabled>
          Edit
        </MenuItem>
      </Menu>,
    )
    await userEvent.click(screen.getByText('Actions'))
    await userEvent.click(screen.getByText('Edit'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
