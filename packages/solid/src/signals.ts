import { type Accessor, createSignal, onCleanup } from 'solid-js'

/** The read side of a Preact/`@cascivo/core` signal; structural, so no import of either. */
export interface ReadableSignal<T> {
  readonly value: T
  subscribe: (fn: (value: T) => void) => () => void
}

/**
 * Bridge a `@cascivo/core` (Preact) signal into Solid: the returned accessor tracks it and
 * unsubscribes with the owner. Lets an island read state shared with non-Solid code.
 */
export function fromSignal<T>(sig: ReadableSignal<T>): Accessor<T> {
  const [value, set] = createSignal<T>(sig.value)
  // Preact's subscribe fires once synchronously with the current value; set() dedupes equal values.
  onCleanup(sig.subscribe((v) => set(() => v)))
  return value
}
