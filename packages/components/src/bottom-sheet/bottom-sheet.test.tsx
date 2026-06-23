import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BottomSheet } from './bottom-sheet'

// A mutable fake clock so drag velocity (px / elapsed ms) is deterministic. Synchronous
// event dispatch otherwise yields tiny, variable real-time deltas → flaky velocity.
let now = 0

beforeEach(() => {
  now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  // Deterministic viewport so drag math (fraction = px / innerHeight) is stable.
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function drag(target: EventTarget, type: string, x: number, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
  })
}

/** The whole header is the drag handle; reach it via the grab separator's parent. */
function header(): HTMLElement {
  return screen.getByRole('separator').parentElement as HTMLElement
}

describe('BottomSheet', () => {
  it('is not in the document when closed', () => {
    render(<BottomSheet title="Filters">content</BottomSheet>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a labelled dialog when open', () => {
    render(
      <BottomSheet open title="Filters">
        content
      </BottomSheet>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Filters')
  })

  it('closes via the close button', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open title="Filters" onOpenChange={onOpenChange}>
        content
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open title="Filters" onOpenChange={onOpenChange}>
        content
      </BottomSheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('dismisses when dragged down past the lowest detent', () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open title="Filters" onOpenChange={onOpenChange}>
        content
      </BottomSheet>,
    )
    drag(header(), 'pointerdown', 0, 0)
    now = 300 // slow drag → velocity ~0; dismissal is driven by position
    drag(window, 'pointermove', 0, 420)
    drag(window, 'pointerup', 0, 420)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('snaps to a higher detent when dragged up', () => {
    const onSnapChange = vi.fn()
    render(
      <BottomSheet open title="Filters" snapPoints={[0.5, 0.92]} onSnapChange={onSnapChange}>
        content
      </BottomSheet>,
    )
    drag(header(), 'pointerdown', 0, 0)
    now = 300 // slow upward drag → snap, not fling-dismiss
    drag(window, 'pointermove', 0, -250)
    drag(window, 'pointerup', 0, -250)
    expect(onSnapChange).toHaveBeenCalledWith(1)
  })

  it('does not dismiss on a short, slow drag', () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open title="Filters" onOpenChange={onOpenChange}>
        content
      </BottomSheet>,
    )
    drag(header(), 'pointerdown', 0, 0)
    now = 300 // 30px over 300ms = 0.1 px/ms — below the fling threshold
    drag(window, 'pointermove', 0, 30)
    drag(window, 'pointerup', 0, 30)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('dismisses on a fast downward fling even from a small drag', () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open title="Filters" onOpenChange={onOpenChange}>
        content
      </BottomSheet>,
    )
    drag(header(), 'pointerdown', 0, 0)
    now = 4 // 40px over 4ms = 10 px/ms — well past the fling threshold, though the
    // 40px drag alone stays above the lowest detent (would not dismiss on position).
    drag(window, 'pointermove', 0, 40)
    drag(window, 'pointerup', 0, 40)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
