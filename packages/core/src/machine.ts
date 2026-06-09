import { useSignal } from '@preact/signals-react'
import type { Machine, MachineConfig } from './types.ts'

export function createMachine<S extends string, I extends S = S>(
  config: MachineConfig<S, I>,
): Machine<S> {
  return config as Machine<S>
}

export function useMachine<S extends string>(machine: Machine<S>) {
  const state = useSignal<S>(machine.initial)
  const send = (event: string) => {
    const next = machine.states[state.value]?.on?.[event] as S | undefined
    if (next !== undefined) state.value = next
  }
  return [state, send] as const
}
