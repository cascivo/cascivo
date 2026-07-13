'use client'
import { useRef } from 'react'
import { useSignalEffect } from './signals.ts'

export interface UseTypeaheadOptions {
  /**
   * Called with the accumulated lowercased query whenever a printable character is
   * typed within the reset window. The consumer resolves which item to focus/select
   * (e.g. the first item whose label starts with `query`).
   */
  onMatch: (query: string) => void
  /** Milliseconds of inactivity before the query buffer resets. Default 500. */
  resetMs?: number
}

export interface UseTypeaheadReturn {
  /** Spread onto the focusable container (listbox/menu). Feeds printable keys to the buffer. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
  /** Clear the buffer immediately (e.g. on close). */
  reset: () => void
}

// A printable, single-character key press with no modifier — the kind that should
// extend a type-to-select query. Enter/Arrow/Escape/Tab/etc. report multi-char keys.
function isTypeaheadChar(event: React.KeyboardEvent<HTMLElement>): boolean {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
}

/**
 * Type-to-select buffer, without context. The consumer calls `useTypeahead({ onMatch })`
 * and spreads `onKeyDown` onto the focusable list container; each printable key extends
 * the query and fires `onMatch(query)`. The buffer resets after `resetMs` of inactivity.
 *
 * Space is treated as a query character only while a query is already in progress, so a
 * leading Space stays available for activation (WAI-ARIA menu/listbox convention). Repeated
 * identical characters are passed through verbatim (e.g. "aa"); consumers that want the
 * "press 'a' repeatedly to cycle A-items" behavior can detect an all-same-char query.
 */
export function useTypeahead(options: UseTypeaheadOptions): UseTypeaheadReturn {
  const { onMatch, resetMs = 500 } = options
  const query = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Keep the callback current without re-binding the handler each render.
  const onMatchRef = useRef(onMatch)
  onMatchRef.current = onMatch

  const reset = (): void => {
    clearTimeout(timer.current)
    query.current = ''
  }

  // Clear any pending timer on unmount (no useEffect per project rule).
  useSignalEffect(() => () => clearTimeout(timer.current))

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (!isTypeaheadChar(event)) return
    // Leading space is left for activation; space only extends an in-progress query.
    if (event.key === ' ' && query.current === '') return
    query.current += event.key.toLowerCase()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      query.current = ''
    }, resetMs)
    onMatchRef.current(query.current)
  }

  return { onKeyDown, reset }
}
