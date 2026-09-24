'use client'
import { useCallback } from 'react'
import { useSignal, useSignals, type Signal } from './signals.ts'

/**
 * Local state as a signal plus a setter — the React Compiler-safe way to hold state in your own
 * components.
 *
 * ```tsx
 * const [count, setCount] = useSignalState(0)
 * // render: count.value · handler: setCount(count.value + 1) or setCount((n) => n + 1)
 * ```
 *
 * Read `count.value` in render as usual. Write through `setCount` instead of assigning
 * `count.value = …`: the React Compiler refuses to compile a component that assigns to a value
 * returned from a hook, and `react-hooks/immutability` reports it. Calling a setter is neither,
 * so this form compiles, stays reactive, and keeps that lint rule on. (Verified by
 * `pnpm compiler:check`.)
 *
 * The setter's identity is stable for the component's life, so it is safe in dependency lists
 * and as a prop. Like the other cascivo hooks, it subscribes the calling component itself.
 */
export function useSignalState<T>(
  initial: T,
): [Signal<T>, (next: T | ((current: T) => T)) => void] {
  useSignals()
  const sig = useSignal<T>(initial)
  const set = useCallback(
    (next: T | ((current: T) => T)): void => {
      sig.value = typeof next === 'function' ? (next as (current: T) => T)(sig.peek()) : next
    },
    [sig],
  )
  return [sig, set]
}
