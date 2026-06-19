'use client'
import { useRef, type RefObject } from 'react'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

export interface ElementSize {
  width: number
  height: number
}

export interface UseResizeObserverOptions {
  /** Which box model to observe. Default 'content-box'. */
  box?: ResizeObserverBoxOptions
}

export interface UseResizeObserverReturn<T extends Element> {
  /** Attach to the element whose size you want to track. */
  ref: RefObject<T | null>
  /** Latest content-box size, or null before the first observation. */
  size: ReadonlySignal<ElementSize | null>
  /** Latest raw ResizeObserverEntry, or null before the first observation. */
  entry: ReadonlySignal<ResizeObserverEntry | null>
}

/**
 * Observes an element's size with a `ResizeObserver`, exposing the latest size
 * as a signal. The declarative counterpart to Web Awesome's `wa-resize-observer`.
 * Wires the observer inside `useSignalEffect` and disconnects it on teardown.
 * SSR/no-DOM safe. No `useState`/`useEffect`.
 */
export function useResizeObserver<T extends Element = Element>(
  options: UseResizeObserverOptions = {},
): UseResizeObserverReturn<T> {
  const ref = useRef<T | null>(null)
  const size = useSignal<ElementSize | null>(null)
  const entry = useSignal<ResizeObserverEntry | null>(null)

  const box = useSignal(options.box)
  box.value = options.box

  useSignalEffect(() => {
    const observeBox = box.value
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const next = entries[entries.length - 1]
      if (!next) return
      entry.value = next
      size.value = { width: next.contentRect.width, height: next.contentRect.height }
    })
    observer.observe(el, observeBox ? { box: observeBox } : undefined)
    return () => observer.disconnect()
  })

  return { ref, size, entry }
}
