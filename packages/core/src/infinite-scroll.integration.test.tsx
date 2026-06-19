import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignal, useSignals } from './signals.ts'
import { useInfiniteScroll } from './infinite-scroll.ts'

// Documented integration pattern: a sentinel at the end of a list appends a page
// when it scrolls into view. Driven here by a mocked IntersectionObserver.

let observerCallback: IntersectionObserverCallback | null = null
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = (): IntersectionObserverEntry[] => []
  root = null
  rootMargin = ''
  thresholds: number[] = []
  constructor(cb: IntersectionObserverCallback) {
    observerCallback = cb
  }
}

function fireIntersect(): void {
  act(() => {
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  })
}

function InfiniteList() {
  useSignals()
  const items = useSignal<number[]>([0, 1, 2])
  const hasMore = items.value.length < 6
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    onLoadMore: () => {
      items.value = [...items.value, items.value.length]
    },
  })
  return (
    <ul>
      {items.value.map((n) => (
        <li key={n}>item {n}</li>
      ))}
      <li
        data-testid="sentinel"
        ref={(el) => {
          sentinelRef.current = el
        }}
      />
    </ul>
  )
}

beforeEach(() => {
  observerCallback = null
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})
afterEach(() => vi.unstubAllGlobals())

describe('useInfiniteScroll integration', () => {
  it('appends a page each time the sentinel intersects, until hasMore is false', () => {
    render(<InfiniteList />)
    expect(screen.getAllByText(/^item /)).toHaveLength(3)

    fireIntersect()
    expect(screen.getAllByText(/^item /)).toHaveLength(4)

    fireIntersect()
    fireIntersect()
    expect(screen.getAllByText(/^item /)).toHaveLength(6)

    // hasMore is now false — further intersections are no-ops.
    fireIntersect()
    expect(screen.getAllByText(/^item /)).toHaveLength(6)
  })
})
