import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu, ContextMenuItem } from './context-menu'

describe('ContextMenu', () => {
  it('opens on right-click', () => {
    const { container } = render(
      <ContextMenu>
        <div>Right click me</div>
        <ContextMenuItem onSelect={() => {}}>Copy</ContextMenuItem>
      </ContextMenu>,
    )
    const target = screen.getByText('Right click me')
    target.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 200 }),
    )
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
})
