import { describe, it, expect } from 'vitest'
import { createSimulation } from './simulation'

// Tests cover createSimulation() (pure signals, no React hooks).
// useSimulation is React-hook territory tested via component tests in the deploy app.

describe('createSimulation', () => {
  it('starts paused by default', () => {
    const sim = createSimulation()
    expect(sim.running.value).toBe(false)
    expect(sim.tick.value).toBe(0)
    expect(sim.elapsed.value).toBe(0)
  })

  it('autoStart option starts running', () => {
    const sim = createSimulation({ autoStart: true })
    expect(sim.running.value).toBe(true)
  })

  it('start() sets running to true', () => {
    const sim = createSimulation()
    sim.start()
    expect(sim.running.value).toBe(true)
  })

  it('pause() sets running to false', () => {
    const sim = createSimulation({ autoStart: true })
    sim.pause()
    expect(sim.running.value).toBe(false)
  })

  it('reset() clears tick and stops', () => {
    const sim = createSimulation()
    sim.start()
    // Manually advance tick to simulate time passing
    sim.tick.value = 5
    sim.reset()
    expect(sim.tick.value).toBe(0)
    expect(sim.running.value).toBe(false)
  })

  it('elapsed reflects tickMs * tick', () => {
    const sim = createSimulation({ tickMs: 500 })
    sim.tick.value = 4
    expect(sim.elapsed.value).toBe(2000)
  })
})
