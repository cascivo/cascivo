'use client'
import { useRef } from 'react'
import { useSignal, useSignals, type Signal } from './signals.ts'

export interface UseControllableSignalOptions<T> {
  /** Controlled value. When provided, the component is controlled for its whole life. */
  value?: T | undefined
  /** Initial value for uncontrolled use. */
  defaultValue?: T | undefined
  /** Called on every write, in both controlled and uncontrolled modes. */
  onChange?: ((value: T) => void) | undefined
}

/**
 * Codifies the controlled/uncontrolled pattern documented by hand in CLAUDE.md
 * (`const x = useSignal(open); x.value = open`).
 *
 * Returns a `[signal, setValue]` pair:
 * - **Controlled** (`value` provided): the signal mirrors `value` on every render; `setValue`
 *   does not mutate the signal locally — it only routes the request through `onChange` so the
 *   parent owns the state (React semantics).
 * - **Uncontrolled** (`value` undefined): the signal owns the state seeded from `defaultValue`;
 *   `setValue` updates it locally and also calls `onChange`.
 *
 * Whether a component is controlled is fixed for its life, exactly like React.
 */
export function useControllableSignal<T>(
  options: UseControllableSignalOptions<T>,
): [Signal<T>, (next: T) => void] {
  // Self-subscribe so a plain React consumer that reads the returned signal in
  // render re-renders on writes without calling useSignals() itself.
  useSignals()
  const { value, defaultValue, onChange } = options
  const isControlled = value !== undefined

  const sig = useSignal<T>((isControlled ? value : defaultValue) as T)

  // Keep onChange current without an effect (the onCloseRef idiom from CLAUDE.md).
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  /*
   * Controlled: mirror the prop into the signal, skipping the write when it already matches.
   *
   * The `Object.is` guard is not an optimisation. A render-phase write notifies the
   * subscriptions opened by the *previous* render, so the signals runtime calls
   * `forceStoreRerender` from inside the current render pass and React 19 reports "Cannot
   * update a component while rendering a different component" (2026-08-08 report A). Writing
   * an unchanged value used to pay that cost for nothing.
   *
   * ⚠ A genuinely changed controlled value still writes here, and still costs one forced
   * re-render. That is unavoidable while the value is both written in render and read by a
   * subscribed component — deferring it would render one tick stale, and writing it eagerly
   * in `setValue` would let a rejected change flash on screen, which is what `useDisclosure`
   * exists to prevent. Components that read the value only in render (never through a
   * `useComputed` chain) should read the prop directly instead of mirroring it at all; see
   * `DataTable`'s selection for the pattern.
   */
  if (isControlled && !Object.is(sig.peek(), value)) sig.value = value as T

  const setValue = (next: T): void => {
    if (!isControlled) sig.value = next
    onChangeRef.current?.(next)
  }

  return [sig, setValue]
}
