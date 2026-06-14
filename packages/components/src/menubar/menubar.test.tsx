import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Menubar, type MenubarMenu } from './menubar'

afterEach(cleanup)

function buildMenus(onNew = vi.fn()): MenubarMenu[] {
  return [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'new', label: 'New', onSelect: onNew },
        { id: 'open', label: 'Open' },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [{ id: 'undo', label: 'Undo' }],
    },
  ]
}

describe('Menubar', () => {
  it('renders a menubar with menuitem triggers', () => {
    render(<Menubar aria-label="Main" menus={buildMenus()} />)
    expect(screen.getByRole('menubar', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'File' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
  })

  it('moves focus across triggers with arrow keys', async () => {
    render(<Menubar aria-label="Main" menus={buildMenus()} />)
    const file = screen.getByRole('menuitem', { name: 'File' })
    file.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(file).toHaveFocus()
  })

  it('opens a menu on click and sets aria-expanded', async () => {
    render(<Menubar aria-label="Main" menus={buildMenus()} />)
    const file = screen.getByRole('menuitem', { name: 'File' })
    await userEvent.click(file)
    expect(file).toHaveAttribute('aria-expanded', 'true')
    const menu = document.getElementById(file.getAttribute('aria-controls') ?? '')
    expect(menu).not.toBeNull()
    expect(menu?.getAttribute('role')).toBe('menu')
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('selects an item and closes the menu', async () => {
    const onNew = vi.fn()
    render(<Menubar aria-label="Main" menus={buildMenus(onNew)} />)
    await userEvent.click(screen.getByRole('menuitem', { name: 'File' }))
    await userEvent.click(screen.getByText('New'))
    expect(onNew).toHaveBeenCalledOnce()
    expect(screen.queryByText('New')).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'File' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens a menu with ArrowDown and closes with Escape', async () => {
    render(<Menubar aria-label="Main" menus={buildMenus()} />)
    const file = screen.getByRole('menuitem', { name: 'File' })
    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(file).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    expect(file).toHaveAttribute('aria-expanded', 'false')
  })
})
