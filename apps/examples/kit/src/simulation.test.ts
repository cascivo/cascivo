import { describe, it, expect, vi } from 'vitest'
import { createSimulation } from './simulation'

// Tests cover createSimulation() (pure signals, no React hooks).
// useSimulation is React-hook territory tested via component tests in the deploy app.

describe('createSimulation', () => {
  it('starts stopped by default', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 1000, seed: 0, onTick })
    expect(sim.running.value).toBe(false)
  })

  it('start() sets running to true', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 1000, seed: 0, onTick })
    sim.start()
    expect(sim.running.value).toBe(true)
    sim.stop()
  })

  it('stop() sets running to false', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 1000, seed: 0, onTick })
    sim.start()
    sim.stop()
    expect(sim.running.value).toBe(false)
  })

  it('toggle() starts when stopped', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 1000, seed: 0, onTick })
    sim.toggle()
    expect(sim.running.value).toBe(true)
    sim.stop()
  })

  it('toggle() stops when running', () => {
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 1000, seed: 0, onTick })
    sim.start()
    sim.toggle()
    expect(sim.running.value).toBe(false)
  })

  it('start() is idempotent — double-start does not duplicate interval', () => {
    vi.useFakeTimers()
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 100, seed: 0, onTick })
    sim.start()
    sim.start()
    vi.advanceTimersByTime(300)
    // should tick exactly 3 times, not 6
    expect(onTick).toHaveBeenCalledTimes(3)
    sim.stop()
    vi.useRealTimers()
  })

  it('onTick is called with rng on each interval', () => {
    vi.useFakeTimers()
    const onTick = vi.fn()
    const sim = createSimulation({ tickMs: 50, seed: 42, onTick })
    sim.start()
    vi.advanceTimersByTime(150)
    expect(onTick).toHaveBeenCalledTimes(3)
    sim.stop()
    vi.useRealTimers()
  })
})
