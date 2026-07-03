import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useElementSize } from './useElementSize'

function Host() {
  const box = useElementSize<HTMLDivElement>()
  return <div ref={box.ref} data-w={box.width.value} data-h={box.height.value} />
}

describe('useElementSize', () => {
  it('returns size signals and observes/disconnects around the lifecycle', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    const original = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      observe = observe
      unobserve() {}
      disconnect = disconnect
    } as unknown as typeof ResizeObserver

    const { container, unmount } = render(<Host />)
    // Starts at 0/0 before any observation.
    const el = container.querySelector('div')!
    expect(el.getAttribute('data-w')).toBe('0')
    expect(observe).toHaveBeenCalledTimes(1)

    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)

    globalThis.ResizeObserver = original
  })
})
