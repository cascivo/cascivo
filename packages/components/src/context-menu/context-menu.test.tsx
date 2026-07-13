import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu, ContextMenuItem } from './context-menu'

describe('ContextMenu', () => {
  it('opens on right-click', async () => {
    const { container } = render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    await act(async () => {
      target.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
      )
    })
    // jsdom doesn't support popover API, so check data-state attribute directly
    const menu = container.querySelector('[role="menu"]')
    expect(menu?.getAttribute('data-state')).toBe('open')
  })

  it('calls onSelect when item is clicked', async () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={onSelect}>Copy</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    target.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
    )
    screen.getByText('Copy').click()
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('disabled item does not call onSelect', () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={onSelect} disabled>
          Disabled
        </ContextMenuItem>
      </ContextMenu>,
    )
    screen.getByText('Disabled').click()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('ArrowDown moves focus to the next enabled item, skipping disabled ones', async () => {
    render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
        <ContextMenuItem onSelect={() => {}} disabled>
          Paste
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => {}}>Delete</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    await act(async () => {
      target.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
      )
    })
    expect(screen.getByText('Copy')).toHaveFocus()

    await act(async () => {
      screen
        .getByText('Copy')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(screen.getByText('Delete')).toHaveFocus()
  })

  it('ArrowUp wraps focus from the first item to the last enabled item', async () => {
    render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
        <ContextMenuItem onSelect={() => {}}>Delete</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    await act(async () => {
      target.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
      )
    })
    expect(screen.getByText('Copy')).toHaveFocus()

    await act(async () => {
      screen
        .getByText('Copy')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    })
    expect(screen.getByText('Delete')).toHaveFocus()
  })

  it('Enter activates the focused item', async () => {
    const onSelect = vi.fn()
    render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={onSelect}>Copy</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    await act(async () => {
      target.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
      )
    })
    await act(async () => {
      screen
        .getByText('Copy')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
