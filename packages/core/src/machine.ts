import { useSignal } from '@preact/signals-react'
import { useSignals } from './signals.ts'
import { transition } from './fsm.ts'
import type { Machine } from './types.ts'

export { createMachine } from './fsm.ts'

export function useMachine<S extends string>(machine: Machine<S>) {
  // Self-subscribe so a plain React consumer that reads the state signal in render
  // re-renders on transitions without calling useSignals() itself.
  useSignals()
  const state = useSignal<S>(machine.initial)
  const send = (event: string) => {
    state.value = transition(machine, state.value, event)
  }
  return [state, send] as const
}
