import { signal, computed, useSignal, useComputed, useSignalEffect } from '@cascivo/core'
import type { Signal, ReadonlySignal } from '@cascivo/core'

export interface SimulationOptions {
  tickMs?: number
  autoStart?: boolean
}

export interface SimulationState {
  running: Signal<boolean>
  tick: Signal<number>
  elapsed: ReadonlySignal<number>
  start(): void
  pause(): void
  reset(): void
}

/**
 * createSimulation — pure signal-based simulation state, no React hooks.
 * Uses signal() / computed() primitives directly so it's safe outside components
 * (module scope, tests, factory functions).
 */
export function createSimulation(options: SimulationOptions = {}): SimulationState {
  const { tickMs = 1000, autoStart = false } = options

  const running = signal(autoStart)
  const tick = signal(0)
  const elapsed = computed(() => tick.value * tickMs)

  return {
    running,
    tick,
    elapsed,
    start() {
      running.value = true
    },
    pause() {
      running.value = false
    },
    reset() {
      running.value = false
      tick.value = 0
    },
  }
}

/**
 * useSimulation — React hook that wires the simulation to a real interval.
 * Uses useSignalEffect (never useEffect) to manage the interval lifecycle.
 */
export function useSimulation(options: SimulationOptions = {}): SimulationState {
  const { tickMs = 1000, autoStart = false } = options

  const running = useSignal(autoStart)
  const tick = useSignal(0)
  const elapsed = useComputed(() => tick.value * tickMs)

  useSignalEffect(() => {
    if (!running.value) return
    const id = setInterval(() => {
      tick.value++
    }, tickMs)
    return () => clearInterval(id)
  })

  return {
    running,
    tick,
    elapsed,
    start() {
      running.value = true
    },
    pause() {
      running.value = false
    },
    reset() {
      running.value = false
      tick.value = 0
    },
  }
}
