'use client'
import { useRef, type RefObject } from 'react'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

export interface UseMutationObserverReturn<T extends Node> {
  /** Attach to the node whose mutations you want to watch. */
  ref: RefObject<T | null>
  /** The records from the most recent mutation batch. */
  records: ReadonlySignal<MutationRecord[]>
}

/**
 * Watches a node's DOM tree with a `MutationObserver`, exposing the latest batch
 * of records as a signal. The declarative counterpart to Web Awesome's
 * `wa-mutation-observer`. Wires the observer inside `useSignalEffect` and
 * disconnects it on teardown. SSR/no-DOM safe. No `useState`/`useEffect`.
 *
 * `init` is read when the effect (re-)subscribes; pass a stable object or accept
 * that changing it between renders won't re-subscribe (mount-time semantics).
 */
export function useMutationObserver<T extends Node = Element>(
  init: MutationObserverInit = { childList: true },
): UseMutationObserverReturn<T> {
  const ref = useRef<T | null>(null)
  const records = useSignal<MutationRecord[]>([])
  const initRef = useRef(init)
  initRef.current = init

  useSignalEffect(() => {
    const node = ref.current
    if (!node || typeof MutationObserver === 'undefined') return

    const observer = new MutationObserver((mutations) => {
      records.value = mutations
    })
    observer.observe(node, initRef.current)
    return () => observer.disconnect()
  })

  return { ref, records }
}
