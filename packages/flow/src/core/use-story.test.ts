import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ResolvedStep } from '../engine/script.ts'
import { useStory, type StoryClock } from './use-story.ts'

function fakeClock() {
  let pending: { id: number; cb: () => void; ms: number }[] = []
  let id = 0
  let lastMs = 0
  const clock: StoryClock = {
    setTimeout: (cb, ms) => {
      const myId = ++id
      lastMs = ms
      pending.push({ id: myId, cb, ms })
      return myId
    },
    clearTimeout: (h) => {
      pending = pending.filter((p) => p.id !== h)
    },
  }
  return { clock, tick: () => pending.splice(0).forEach((p) => p.cb()), lastMs: () => lastMs }
}

const steps: ResolvedStep[] = [
  { edgeId: 'ab', direction: 'forward' },
  { edgeId: 'bc', direction: 'forward' },
]

describe('useStory', () => {
  it('advances on each tick', () => {
    const { clock, tick } = fakeClock()
    const { result } = renderHook(() => useStory({ steps, loop: false, clock }))
    expect(result.current.currentStep.value).toBe(0)
    tick()
    expect(result.current.currentStep.value).toBe(1)
  })

  it('wraps when loop is set', () => {
    const { clock, tick } = fakeClock()
    const { result } = renderHook(() => useStory({ steps, loop: true, clock }))
    tick() // 0 → 1
    tick() // 1 → wrap to 0
    expect(result.current.currentStep.value).toBe(0)
  })

  it('stops at the end when loop is off', () => {
    const { clock, tick } = fakeClock()
    const { result } = renderHook(() => useStory({ steps, loop: false, clock }))
    tick() // 0 → 1
    tick() // last → stop, playing false
    expect(result.current.currentStep.value).toBe(1)
    expect(result.current.playing.value).toBe(false)
  })

  it('pause halts advance', () => {
    const { clock, tick } = fakeClock()
    const { result } = renderHook(() => useStory({ steps, loop: true, clock }))
    result.current.pause()
    tick()
    expect(result.current.currentStep.value).toBe(0)
  })

  it('next/prev/restart act immediately', () => {
    const { clock } = fakeClock()
    const { result } = renderHook(() =>
      useStory({ steps, loop: true, defaultPlaying: false, clock }),
    )
    result.current.next()
    expect(result.current.currentStep.value).toBe(1)
    result.current.prev()
    expect(result.current.currentStep.value).toBe(0)
    result.current.prev() // wraps
    expect(result.current.currentStep.value).toBe(1)
    result.current.restart()
    expect(result.current.currentStep.value).toBe(0)
    expect(result.current.playing.value).toBe(true)
  })

  it('exposes the active step', () => {
    const { clock } = fakeClock()
    const { result } = renderHook(() => useStory({ steps, defaultPlaying: false, clock }))
    expect(result.current.activeStep.value).toEqual(steps[0])
  })

  it('stepGap extends the dwell before advancing', () => {
    const { clock, lastMs } = fakeClock()
    renderHook(() => useStory({ steps, stepDuration: 1000, stepGap: 500, clock }))
    expect(lastMs()).toBe(1500)
  })
})
