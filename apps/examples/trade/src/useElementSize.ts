'use client'
import { useSignal, useSignalEffect, type ReadonlySignal } from '@cascivo/core'
import { useRef, type RefObject } from 'react'

export interface ElementSize<T extends HTMLElement> {
  ref: RefObject<T | null>
  width: ReadonlySignal<number>
  height: ReadonlySignal<number>
}

/**
 * Observe an element's content-box size via ResizeObserver and expose it as
 * signals. Signal-driven (no useState); the observer starts on mount and
 * disconnects on unmount. Returns 0/0 until the first observation.
 */
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): ElementSize<T> {
  const ref = useRef<T | null>(null)
  const width = useSignal(0)
  const height = useSignal(0)

  useSignalEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) {
        width.value = box.width
        height.value = box.height
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  })

  return { ref, width, height }
}
