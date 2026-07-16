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

  // Controlled: mirror the prop into the signal each render (no-op if unchanged).
  if (isControlled) sig.value = value as T

  const setValue = (next: T): void => {
    if (!isControlled) sig.value = next
    onChangeRef.current?.(next)
  }

  return [sig, setValue]
}
