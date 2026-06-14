import { signal, useSignalEffect, useSignals } from '@cascivo/core'
import type { Signal } from '@cascivo/core'
import { seededRandom } from './seeded-random'
import type { SeededRandom } from './seeded-random'

export interface Simulation {
  running: Signal<boolean>
  start(): void
  stop(): void
  toggle(): void
}

export function createSimulation(opts: {
  tickMs: number
  seed: number
  onTick: (rng: SeededRandom) => void
}): Simulation {
  const running = signal(false)
  const rng = seededRandom(opts.seed)
  let handle: ReturnType<typeof setInterval> | null = null

  function start() {
    if (handle !== null) return
    running.value = true
    handle = setInterval(() => opts.onTick(rng), opts.tickMs)
  }

  function stop() {
    if (handle !== null) {
      clearInterval(handle)
      handle = null
    }
    running.value = false
  }

  function toggle() {
    if (running.value) {
      stop()
    } else {
      start()
    }
  }

  return { running, start, stop, toggle }
}

export function useSimulation(sim: Simulation): void {
  useSignals()
  useSignalEffect(() => {
    if (sim.running.value) {
      sim.start()
      return () => sim.stop()
    }
  })
}
