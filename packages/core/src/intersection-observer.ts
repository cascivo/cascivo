'use client'
import { useRef, type RefObject } from 'react'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

export interface UseIntersectionObserverOptions {
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

export interface UseIntersectionObserverReturn<T extends Element> {
  /** Attach to the element whose visibility you want to track. */
  ref: RefObject<T | null>
  /** Latest IntersectionObserverEntry, or null before the first observation. */
  entry: ReadonlySignal<IntersectionObserverEntry | null>
  /** Whether the element is currently intersecting the root. */
  isIntersecting: ReadonlySignal<boolean>
}

/**
 * Tracks an element's visibility with an `IntersectionObserver`, exposing the
 * latest entry and an `isIntersecting` flag as signals. The declarative
 * counterpart to Web Awesome's `wa-intersection-observer`.
 *
 * This is the **generic** observer — for "load more when a sentinel appears"
 * use `useInfiniteScroll`, which adds `hasMore`/`onLoadMore` semantics on top.
 *
 * Wires the observer inside `useSignalEffect` and disconnects it on teardown.
 * SSR/no-DOM safe. No `useState`/`useEffect`.
 */
export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn<T> {
  const { rootMargin = '0px', threshold = 0 } = options
  const ref = useRef<T | null>(null)
  const entry = useSignal<IntersectionObserverEntry | null>(null)
  const isIntersecting = useSignal(false)
  const rootRef = useRef(options.root ?? null)
  rootRef.current = options.root ?? null

  useSignalEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const next = entries[entries.length - 1]
        if (!next) return
        entry.value = next
        isIntersecting.value = next.isIntersecting
      },
      { root: rootRef.current, rootMargin, threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  })

  return { ref, entry, isIntersecting }
}
