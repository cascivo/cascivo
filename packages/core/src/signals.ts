import {
  useComputed as usePreactComputed,
  useSignal as usePreactSignal,
} from '@preact/signals-react'
import type { ReadonlySignal, Signal } from '@preact/signals-react'
import { useSignals } from '@preact/signals-react/runtime'

export { signal, computed, effect, batch, useSignalEffect } from '@preact/signals-react'
export type { Signal, ReadonlySignal } from '@preact/signals-react'
export { useSignals } from '@preact/signals-react/runtime'

/*
 * Why these two are wrapped rather than re-exported.
 *
 * `@preact/signals-react`'s own `useSignal`/`useComputed` do NOT subscribe the calling
 * component — subscription normally comes from the Babel signals transform, which no
 * consumer app runs (and which no cascivo doc asks you to install). Re-exported raw, they
 * produce a silently frozen UI: handlers fire, signals update, the DOM never moves.
 *
 * docs/HEADLESS.md has always promised the opposite ("all call `useSignals()` for you"),
 * and ten of the twelve hooks it names already did. These two — the two the reactivity
 * contract tells you to reach for first — did not. Wrapping makes the promise true instead
 * of making the docs worse, and the promise is now executable: see `self-subscribe.test.tsx`
 * and `scripts/checks/self-subscribe-parity.test.ts`.
 *
 * `signal`/`computed`/`effect`/`batch` are NOT hooks and stay untouched — a component that
 * reads a module-level `signal()` in render still needs its own `useSignals()`, which is the
 * one part of the rule that survives.
 */

/**
 * Local reactive state — the signal IS the state (use instead of `useState`).
 *
 * Calls `useSignals()` internally, so a component that reads the returned signal during
 * render re-renders on writes **without** the Babel signals transform and without calling
 * `useSignals()` itself.
 *
 * Caveat: the tracking window opens where this hook is called. A signal read that happens
 * *earlier* in the render body than the first `useSignal`/`useComputed` call is not tracked —
 * so call these before any signal read, or call `useSignals()` first. (Reading a signal before
 * any hook runs is unusual; the case is locked by a test.)
 */
export function useSignal<T>(initial: T): Signal<T> {
  useSignals()
  return usePreactSignal(initial)
}

/**
 * Derived reactive state (use instead of a `useMemo`/`useState` pair). Recomputes only when a
 * signal it reads changes.
 *
 * Calls `useSignals()` internally — same contract and same tracking-window caveat as
 * {@link useSignal}.
 */
export function useComputed<T>(compute: () => T): ReadonlySignal<T> {
  useSignals()
  return usePreactComputed(compute)
}
