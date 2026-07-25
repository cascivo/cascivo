'use client'
// Deliberately the raw hook, not our self-subscribing `useSignal`: the signal this
// primitive returns is for `useSignalEffect` consumers, so subscribing the calling
// component to it would be misleading (see the render-read warning below).
import { useSignal as usePreactSignal } from '@preact/signals-react'
import { useRef } from 'react'
import type { ReadonlySignal } from './signals.ts'

/**
 * Mirror a controlled React prop into a signal that is read **inside effects**, not in
 * render. The write is deferred to a microtask, so a prop change never runs a subscribed
 * `useSignalEffect` body during React's render phase.
 *
 * ## Which mirror do I want?
 *
 * | The signal is read… | Use | Why |
 * | --- | --- | --- |
 * | in render (JSX, a `data-*` attribute, a derived value) | `useControllableSignal` — or the plain `const s = useSignal(prop); s.value = prop` idiom | The write must be synchronous or the component renders one tick stale. A render-phase write that only notifies the *writing* component's own subscription is a legal same-fiber render-phase update. |
 * | only inside `useSignalEffect` | **this** | Preact signals run effects **synchronously on write**, so a render-phase write executes effect bodies mid-render — imperative DOM calls (`showModal()`), listener registration against a pre-commit ref, and parent `setState` callbacks, all inside React's render phase. React warns `Cannot update a component while rendering a different component`; the behavior is wrong even when it doesn't. |
 *
 * That distinction is the rule; it is documented in `CLAUDE.md` ("Syncing a controlled React
 * prop into a signal"), `docs/HEADLESS.md`, and `docs/AI-RULES.md`.
 *
 * ## Constraints
 *
 * - **Do not read the returned signal in render.** It lags the prop by one microtask by
 *   design. Read the prop itself, or use `useControllableSignal`.
 * - **Pass a primitive.** A value with a new identity every render (an inline object or
 *   array literal) never compares equal, so the effect would re-run every render. Mirror
 *   its identity-stable parts instead.
 * - SSR-safe: on the server the first render's value already matches, so nothing is ever
 *   scheduled and no work can leak between requests.
 */
export function useEffectPropSignal<T>(value: T): ReadonlySignal<T> {
  const sig = usePreactSignal(value)

  // Always mirror the newest value, so a superseded write collapses instead of replaying
  // an older prop through the effect.
  const latest = useRef(value)
  latest.current = value

  const scheduled = useRef(false)
  if (!Object.is(sig.peek(), value) && !scheduled.current) {
    scheduled.current = true
    queueMicrotask(() => {
      scheduled.current = false
      if (!Object.is(sig.peek(), latest.current)) sig.value = latest.current
    })
  }

  return sig
}
