import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SwipeItem, type SwipeAction } from './swipe-item'

// Mutable fake clock so drag velocity (px / elapsed ms) is deterministic.
let now = 0

beforeEach(() => {
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function drag(target: EventTarget, type: string, x: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: 0, bubbles: true }))
  })
}

function trailing(onSelect = vi.fn()): SwipeAction[] {
  return [{ label: 'Delete', onSelect, destructive: true }]
}

function row(): HTMLElement {
  return screen.getByText('Inbox row').parentElement as HTMLElement
}

describe('SwipeItem', () => {
  it('renders content and keeps actions in the a11y tree when closed', () => {
    render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    expect(screen.getByText('Inbox row')).toBeInTheDocument()
    // Action is present (reachable) even though the row is closed.
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('opens the trailing side when dragged far enough toward the start', () => {
    const { container } = render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-state', 'closed')
    drag(row(), 'pointerdown', 0)
    now = 300 // slow drag → snap decided by position, not velocity
    drag(window, 'pointermove', -60) // past half of one 72px action
    drag(window, 'pointerup', -60)
    expect(root).toHaveAttribute('data-state', 'trailing')
  })

  it('snaps back closed on a short drag', () => {
    const { container } = render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    drag(row(), 'pointerdown', 0)
    now = 300
    drag(window, 'pointermove', -20) // under half an action width
    drag(window, 'pointerup', -20)
    expect(root).toHaveAttribute('data-state', 'closed')
  })

  it('opens on a fast flick even from a small drag', () => {
    const { container } = render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    drag(row(), 'pointerdown', 0)
    now = 4 // 24px over 4ms = 6 px/ms — a fast leftward flick
    drag(window, 'pointermove', -24)
    drag(window, 'pointerup', -24)
    expect(root).toHaveAttribute('data-state', 'trailing')
  })

  it('reveals the side when an action is focused (keyboard parity)', () => {
    const { container } = render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    act(() => screen.getByRole('button', { name: 'Delete' }).focus())
    expect(root).toHaveAttribute('data-state', 'trailing')
  })

  it('invokes the action and closes on activation', async () => {
    const onSelect = vi.fn()
    const { container } = render(
      <SwipeItem trailingActions={trailing(onSelect)}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(root).toHaveAttribute('data-state', 'closed')
  })

  it('closes on Escape when open', () => {
    const { container } = render(
      <SwipeItem trailingActions={trailing()}>
        <span>Inbox row</span>
      </SwipeItem>,
    )
    const root = container.firstChild as HTMLElement
    act(() => screen.getByRole('button', { name: 'Delete' }).focus())
    expect(root).toHaveAttribute('data-state', 'trailing')
    act(() => {
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(root).toHaveAttribute('data-state', 'closed')
  })
})
