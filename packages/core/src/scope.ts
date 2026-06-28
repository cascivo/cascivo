'use client'
import { useRef } from 'react'
import {
  computed as coreComputed,
  effect as coreEffect,
  signal as coreSignal,
  useSignalEffect,
  type ReadonlySignal,
  type Signal,
} from './signals.ts'

export interface SignalScope {
  /** Create a signal. Owned by the scope (dropped on dispose). */
  signal: <T>(value: T) => Signal<T>
  /** Create a computed. Owned by the scope. */
  computed: <T>(fn: () => T) => ReadonlySignal<T>
  /** Create an effect. Its subscription is torn down by `dispose()`. */
  effect: (fn: () => void | (() => void)) => () => void
  /** Tear down every owned effect. Idempotent. */
  dispose: () => void
  /** True once disposed. */
  readonly disposed: boolean
}

/**
 * A disposable owner for a set of signals/computeds/effects. Use one scope per
 * tenant boundary — a workspace, an org, a repository group. When the user
 * switches scope, call `dispose()` and create a fresh scope: every effect the
 * old scope started stops firing at once, with no orphaned subscriptions or
 * stale state left running against unmounted UI.
 *
 * This is a thin ownership wrapper over `@cascivo/core` signals — not a store,
 * not a context, not a DI container. Prefer it over accumulating per-workspace
 * state in a single global signal root, which leaks effects across switches.
 */
export function createScope(): SignalScope {
  const disposers = new Set<() => void>()
  let disposed = false

  return {
    signal: (value) => coreSignal(value),
    computed: (fn) => coreComputed(fn),
    effect: (fn) => {
      if (disposed) return () => {}
      const stop = coreEffect(fn)
      disposers.add(stop)
      return () => {
        disposers.delete(stop)
        stop()
      }
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      for (const stop of disposers) stop()
      disposers.clear()
    },
    get disposed(): boolean {
      return disposed
    },
  }
}

/**
 * Bind a {@link createScope} to a component's lifetime: created once on mount,
 * disposed on unmount. The scope's effects stop when the component unmounts.
 */
export function useScope(): SignalScope {
  const ref = useRef<SignalScope | null>(null)
  ref.current ??= createScope()

  useSignalEffect(() => () => ref.current?.dispose())

  return ref.current
}
