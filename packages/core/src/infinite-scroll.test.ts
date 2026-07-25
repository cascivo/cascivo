import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from './infinite-scroll'

let observerCallback: IntersectionObserverCallback | null = null
const observe = vi.fn()
const disconnect = vi.fn()

class MockIntersectionObserver {
  observe = observe
  disconnect = disconnect
  unobserve = vi.fn()
  takeRecords = (): IntersectionObserverEntry[] => []
  root = null
  rootMargin = ''
  thresholds: number[] = []
  constructor(cb: IntersectionObserverCallback) {
    observerCallback = cb
  }
}

function fireIntersect(isIntersecting: boolean): void {
  observerCallback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
}

beforeEach(() => {
  observerCallback = null
  observe.mockClear()
  disconnect.mockClear()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})
afterEach(() => vi.unstubAllGlobals())

describe('useInfiniteScroll', () => {
  it('calls onLoadMore when the sentinel intersects and hasMore is true', () => {
    const onLoadMore = vi.fn()
    const el = document.createElement('div')
    renderHook(() => {
      const r = useInfiniteScroll({ hasMore: true, onLoadMore })
      r.sentinelRef.current = el
      return r
    })
    expect(observe).toHaveBeenCalledWith(el)
    fireIntersect(true)
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn()
    const el = document.createElement('div')
    renderHook(
      ({ hasMore }: { hasMore: boolean }) => {
        const r = useInfiniteScroll({ hasMore, onLoadMore })
        r.sentinelRef.current = el
        return r
      },
      { initialProps: { hasMore: false } },
    )
    fireIntersect(true)
    expect(onLoadMore).not.toHaveBeenCalled()
  })

  // `isEnabled` reaches the effect one microtask after render (`useEffectPropSignal`), so
  // that a prop flip cannot run the observer teardown inside React's render phase.
  it('disconnects the observer when disabled', async () => {
    const onLoadMore = vi.fn()
    const el = document.createElement('div')
    const { rerender } = renderHook(
      ({ isEnabled }: { isEnabled: boolean }) => {
        const r = useInfiniteScroll({ hasMore: true, onLoadMore, isEnabled })
        r.sentinelRef.current = el
        return r
      },
      { initialProps: { isEnabled: true } },
    )
    expect(observe).toHaveBeenCalledTimes(1)
    await act(async () => {
      rerender({ isEnabled: false })
    })
    expect(disconnect).toHaveBeenCalled()
  })
})
