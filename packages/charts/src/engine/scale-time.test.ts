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

/*
 * Tick density across the whole domain range (2026-08-08 adopter pair, report B).
 *
 * `pickInterval` had one entry per unit and no step multiples, so it took the FINEST unit
 * whose raw tick count fit under `count * 1.5`. For a 23-hour window that rejected `hour`
 * (23 ticks) and accepted `day` (~1) — "requests over the last 24 hours", the canonical
 * deploy-dashboard chart, rendered a single midnight tick and ignored `xTicks` entirely.
 *
 * The invariant is density, not a specific unit: a caller asking for ~n ticks must get a
 * usable number of them at every timescale, and never fewer than 2 when the domain is
 * genuinely wider than one step.
 */
const HOUR = 3_600_000
const DAY = 24 * HOUR

describe('timeScale tick density', () => {
  const NOW = Date.UTC(2026, 7, 8, 14, 30)
  const cases: Array<{ name: string; span: number }> = [
    { name: '1 hour', span: HOUR },
    { name: '6 hours', span: 6 * HOUR },
    { name: '23 hours', span: 23 * HOUR },
    { name: '24 hours', span: DAY },
    { name: '3 days', span: 3 * DAY },
    { name: '2 weeks', span: 14 * DAY },
    { name: '6 months', span: 182 * DAY },
    { name: '3 years', span: 1095 * DAY },
  ]

  for (const { name, span } of cases) {
    for (const count of [4, 6, 8, 12]) {
      it(`${name} @ ticks(${count}) returns a usable number of ticks`, () => {
        const s = timeScale([new Date(NOW - span), new Date(NOW)], [0, 800])
        const ticks = s.ticks(count)
        expect(ticks.length).toBeGreaterThanOrEqual(2)
        // Generous band — the point is that `count` is honoured at all, not that the
        // algorithm hits it exactly. Pre-fix, the 23h row returned 1 for every count.
        expect(ticks.length).toBeGreaterThanOrEqual(Math.ceil(count / 2))
        expect(ticks.length).toBeLessThanOrEqual(count * 2)
      })
    }

    it(`${name} ticks are ascending and inside the domain`, () => {
      const d0 = new Date(NOW - span)
      const d1 = new Date(NOW)
      const ticks = timeScale([d0, d1], [0, 800]).ticks(6)
      for (const [i, t] of ticks.entries()) {
        expect(t.getTime()).toBeGreaterThanOrEqual(d0.getTime())
        expect(t.getTime()).toBeLessThanOrEqual(d1.getTime())
        if (i > 0) expect(t.getTime()).toBeGreaterThan(ticks[i - 1]!.getTime())
      }
    })
  }

  it('honours the requested count rather than a hardcoded 5', () => {
    const s = timeScale([new Date(NOW - 23 * HOUR), new Date(NOW)], [0, 800])
    // Pre-fix these were all 1.
    expect(s.ticks(3).length).toBeGreaterThan(1)
    expect(s.ticks(12).length).toBeGreaterThan(s.ticks(3).length)
  })
})

describe('timeScale tick formatting', () => {
  const NOW = Date.UTC(2026, 7, 8, 14, 30)

  it('a sub-day domain formats ticks as times, not repeated dates', () => {
    const s = timeScale([new Date(NOW - 23 * HOUR), new Date(NOW)], [0, 800])
    expect(s.tickInterval(6)).toBe('hour')
    const opts = s.tickFormat(6)
    expect(opts.hour).toBeDefined()
    expect(opts.month).toBeUndefined()

    // The real symptom: every tick rendering the same string.
    const labels = s.ticks(6).map((d) => new Intl.DateTimeFormat('en-US', opts).format(d))
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('a multi-month domain still formats ticks as dates', () => {
    const s = timeScale([new Date(NOW - 182 * DAY), new Date(NOW)], [0, 800])
    const opts = s.tickFormat(6)
    expect(opts.month).toBeDefined()
    expect(opts.hour).toBeUndefined()
  })

  it('tickInterval/tickFormat agree with the ticks actually produced', () => {
    const s = timeScale([new Date(NOW - 6 * HOUR), new Date(NOW)], [0, 800])
    const ticks = s.ticks(6)
    const labels = ticks.map((d) => new Intl.DateTimeFormat('en-US', s.tickFormat(6)).format(d))
    expect(new Set(labels).size).toBe(labels.length)
  })
})
