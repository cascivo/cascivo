import { describe, expect, it } from 'vitest'
import { timeScale } from './scale-time'

describe('timeScale', () => {
  it('maps dates linearly', () => {
    const d0 = new Date(Date.UTC(2024, 0, 1))
    const d1 = new Date(Date.UTC(2024, 11, 31))
    const s = timeScale([d0, d1], [0, 100])
    expect(s.map(d0)).toBeCloseTo(0)
    expect(s.map(d1)).toBeCloseTo(100, 0)
  })

  it('produces month ticks across a year', () => {
    const d0 = new Date(Date.UTC(2024, 0, 1))
    const d1 = new Date(Date.UTC(2024, 11, 31))
    const s = timeScale([d0, d1], [0, 100])
    const ticks = s.ticks(12)
    expect(ticks.length).toBeGreaterThanOrEqual(6)
    ticks.forEach((t) => {
      expect(t.getTime()).toBeGreaterThanOrEqual(d0.getTime())
      expect(t.getTime()).toBeLessThanOrEqual(d1.getTime())
    })
  })

  it('handles year-wrap in month ticks', () => {
    const d0 = new Date(Date.UTC(2023, 10, 1))
    const d1 = new Date(Date.UTC(2024, 2, 1))
    const s = timeScale([d0, d1], [0, 100])
    const ticks = s.ticks(5)
    expect(ticks.length).toBeGreaterThan(0)
    const years = ticks.map((t) => t.getUTCFullYear())
    expect(years).toContain(2023)
    expect(years).toContain(2024)
  })

  it('invert is the inverse of map', () => {
    const d0 = new Date(Date.UTC(2024, 0, 1))
    const d1 = new Date(Date.UTC(2024, 11, 31))
    const s = timeScale([d0, d1], [0, 100])
    const mid = new Date(Date.UTC(2024, 5, 15))
    expect(s.invert(s.map(mid)).getTime()).toBeCloseTo(mid.getTime(), -4)
  })
})
