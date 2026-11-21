import type { Machine, MachineConfig } from './types.ts'

export function createMachine<S extends string, I extends S = S>(
  config: MachineConfig<S, I>,
): Machine<S> {
  return config as Machine<S>
}

/**
 * The next state for `event`, or `state` itself when the table has no such edge. Pure and
 * React-free so `useMachine` and the `@cascivo/elements` custom elements share one
 * transition rule (imported from `@cascivo/core/pure`).
 */
export function transition<S extends string>(machine: Machine<S>, state: S, event: string): S {
  return (machine.states[state]?.on?.[event] as S | undefined) ?? state
}
