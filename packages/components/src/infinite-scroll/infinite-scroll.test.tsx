import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InfiniteScroll } from './infinite-scroll'

afterEach(cleanup)

/** Captured observer callbacks, so a test can drive intersection directly. */
let observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = []

beforeEach(() => {
  observers = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn()
      constructor(public callback: IntersectionObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect })
      }
      observe = vi.fn()
      unobserve = vi.fn()
      takeRecords = vi.fn(() => [])
    },
  )
})

/** Fire the most recent observer as if the sentinel scrolled into view. */
function intersect(): void {
  const observer = observers.at(-1)
  act(() => {
    observer?.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  })
}

describe('InfiniteScroll', () => {
  it('renders an activatable button rather than a bare sentinel', () => {
    render(<InfiniteScroll onLoadMore={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
  })

  it('loads when the sentinel intersects', () => {
    const onLoadMore = vi.fn()
    render(<InfiniteScroll onLoadMore={onLoadMore} />)
    intersect()
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('loads when the button is activated', () => {
    const onLoadMore = vi.fn()
    render(<InfiniteScroll onLoadMore={onLoadMore} />)
    act(() => {
      screen.getByRole('button', { name: 'Load more' }).click()
    })
    expect(onLoadMore).toHaveBeenCalledOnce()
  })

  it('announces loading and does not re-enter while a page is in flight', async () => {
    let resolveLoad = (): void => {}
    const promise = new Promise<void>((r) => {
      resolveLoad = r
    })
    const onLoadMore = vi.fn(() => promise)
    render(<InfiniteScroll onLoadMore={onLoadMore} />)

    intersect()
    expect(screen.getByRole('status')).toHaveTextContent('Loading more')

    // A sentinel still in view after a short page must not stack another load.
    intersect()
    expect(onLoadMore).toHaveBeenCalledOnce()

    await act(async () => {
      resolveLoad()
      await promise
    })
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
  })

  it('clears the loading state when the load rejects', async () => {
    const onLoadMore = vi.fn(() => Promise.reject(new Error('network')))
    render(<InfiniteScroll onLoadMore={onLoadMore} />)
    intersect()
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument()
  })

  it('renders nothing and never loads when disabled', () => {
    const onLoadMore = vi.fn()
    const { container } = render(<InfiniteScroll onLoadMore={onLoadMore} disabled />)
    expect(container).toBeEmptyDOMElement()
    expect(observers).toHaveLength(0)
    expect(onLoadMore).not.toHaveBeenCalled()
  })
})
