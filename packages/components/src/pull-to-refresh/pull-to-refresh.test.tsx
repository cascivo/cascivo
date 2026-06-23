import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PullToRefresh } from './pull-to-refresh'

afterEach(cleanup)

function pointer(target: EventTarget, type: string, y: number): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { clientX: 0, clientY: y, bubbles: true }))
  })
}

function viewport(): HTMLElement {
  return screen.getByText('content').parentElement as HTMLElement
}

/** Pull the viewport down by `dy` finger px (pull distance is dy * 0.5). */
function pull(dy: number): void {
  pointer(viewport(), 'pointerdown', 0)
  pointer(window, 'pointermove', dy)
  pointer(window, 'pointerup', dy)
}

describe('PullToRefresh', () => {
  it('renders children', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <div>content</div>
      </PullToRefresh>,
    )
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('triggers onRefresh after a pull past the threshold and clears when it settles', async () => {
    let resolveRefresh = (): void => {}
    const promise = new Promise<void>((r) => {
      resolveRefresh = r
    })
    const onRefresh = vi.fn(() => promise)
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={64}>
        <div>content</div>
      </PullToRefresh>,
    )
    // 200px finger travel → 100px pull, past the 64px threshold.
    pull(200)
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(screen.getByText('Refreshing')).toBeInTheDocument()

    await act(async () => {
      resolveRefresh()
      await promise
    })
    expect(screen.queryByText('Refreshing')).not.toBeInTheDocument()
  })

  it('does not trigger on a short pull', () => {
    const onRefresh = vi.fn()
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={64}>
        <div>content</div>
      </PullToRefresh>,
    )
    pull(40) // 20px pull — under threshold
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not trigger when disabled', () => {
    const onRefresh = vi.fn()
    render(
      <PullToRefresh onRefresh={onRefresh} disabled>
        <div>content</div>
      </PullToRefresh>,
    )
    pull(200)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not arm when the viewport is not scrolled to the top', () => {
    const onRefresh = vi.fn()
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>content</div>
      </PullToRefresh>,
    )
    Object.defineProperty(viewport(), 'scrollTop', { value: 50, configurable: true })
    pull(200)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('announces the release state once pulled past the threshold', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()} threshold={64}>
        <div>content</div>
      </PullToRefresh>,
    )
    // Hold the gesture mid-pull (no pointerup) past the threshold.
    pointer(viewport(), 'pointerdown', 0)
    pointer(window, 'pointermove', 200)
    expect(screen.getByText('Release to refresh')).toBeInTheDocument()
    pointer(window, 'pointerup', 200)
  })
})
