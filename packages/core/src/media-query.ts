'use client'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

function initialMatch(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

/**
 * `useMediaQuery(query)` → a `ReadonlySignal<boolean>` that tracks whether the media query matches.
 * SSR-safe (defaults to `false` when `window`/`matchMedia` is unavailable). Subscribes to changes
 * inside `useSignalEffect`; the listener is cleaned up on teardown.
 */
export function useMediaQuery(query: string): ReadonlySignal<boolean> {
  const matches = useSignal(initialMatch(query))

  useSignalEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    matches.value = mql.matches
    const handler = (event: MediaQueryListEvent): void => {
      matches.value = event.matches
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  })

  return matches
}
