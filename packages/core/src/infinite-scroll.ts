'use client'
import { useRef, type RefObject } from 'react'
import { useEffectPropSignal } from './effect-prop.ts'
import { useSignal, useSignalEffect } from './signals.ts'

export interface UseInfiniteScrollOptions {
  /** Whether more items remain to load. */
  hasMore: boolean
  /** Called when the sentinel scrolls into view and `hasMore` is true. */
  onLoadMore: () => void
  /** Disable the observer without unmounting. Default true. */
  isEnabled?: boolean
  /** IntersectionObserver rootMargin (e.g. '200px' to prefetch early). */
  rootMargin?: string
}

export interface UseInfiniteScrollReturn {
  /** Place on a trailing element at the end of the list. */
  sentinelRef: RefObject<HTMLElement | null>
  /** Optional scroll container; defaults to the viewport. */
  rootRef: RefObject<HTMLElement | null>
}

/**
 * Calls `onLoadMore` when a sentinel element scrolls into view, gated by
 * `hasMore`. Wires an `IntersectionObserver` inside `useSignalEffect` and
 * disconnects it on teardown. SSR/no-DOM safe. Replaces HeroUI's
 * `@heroui/use-infinite-scroll`. No `useState`/`useEffect`.
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const { rootMargin = '0px' } = options
  const sentinelRef = useRef<HTMLElement | null>(null)
  const rootRef = useRef<HTMLElement | null>(null)

  // `isEnabled` drives the effect (it re-attaches the observer), so it is a deferred signal.
  // `hasMore`/`onLoadMore` are read inside the IntersectionObserver callback — which runs
  // outside the effect's tracking scope — so they are refs: a ref is exact at callback time,
  // where a signal would both be redundant and lag the prop by a microtask.
  const enabled = useEffectPropSignal(options.isEnabled ?? true)
  const hasMoreRef = useRef(options.hasMore)
  hasMoreRef.current = options.hasMore
  const onLoadMoreRef = useRef(options.onLoadMore)
  onLoadMoreRef.current = options.onLoadMore

  useSignalEffect(() => {
    const isEnabled = enabled.value
    const sentinel = sentinelRef.current
    if (!isEnabled || typeof IntersectionObserver === 'undefined' || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreRef.current) onLoadMoreRef.current()
      },
      { root: rootRef.current ?? null, rootMargin },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  })

  return { sentinelRef, rootRef }
}
