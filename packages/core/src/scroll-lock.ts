'use client'
import { useSignalEffect, type Signal } from './signals.ts'

/**
 * Locks `document.body` scroll while `locked` is true, compensating for the scrollbar width to
 * avoid a layout shift. Accepts a plain boolean or a `Signal<boolean>` (reactive). The previous
 * inline styles are restored on unlock/teardown. DOM work runs inside `useSignalEffect`.
 */
export function useScrollLock(locked: Signal<boolean> | boolean): void {
  useSignalEffect(() => {
    const isLocked = typeof locked === 'boolean' ? locked : locked.value
    if (!isLocked || typeof document === 'undefined') return

    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPaddingInlineEnd = body.style.paddingInlineEnd

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      const current = Number.parseInt(window.getComputedStyle(body).paddingInlineEnd, 10) || 0
      body.style.paddingInlineEnd = `${current + scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingInlineEnd = prevPaddingInlineEnd
    }
  })
}
