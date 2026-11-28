import { describe, it, expect } from 'vitest'
import {
  HOSTS,
  INITIAL_LATENCY_HISTORY,
  INITIAL_HOST_METRICS,
  INITIAL_HEATMAP_GRID,
  INITIAL_LOGS,
  INITIAL_EVENTS,
  SPIKE_PERIOD,
  latencySample,
} from '../src/data/seed'

describe('seed data', () => {
  it('generates 4 hosts', () => {
    expect(HOSTS).toHaveLength(4)
  })

  it('generates 60 latency history points', () => {
    expect(INITIAL_LATENCY_HISTORY).toHaveLength(60)
  })

  it('all latency points have p50 < p95 < p99', () => {
    for (const pt of INITIAL_LATENCY_HISTORY) {
      expect(pt.p50).toBeLessThanOrEqual(pt.p95)
      expect(pt.p95).toBeLessThanOrEqual(pt.p99)
    }
  })

  it('generates 4 host metrics', () => {
    expect(INITIAL_HOST_METRICS).toHaveLength(4)
  })

  it('heatmap grid is 24x60', () => {
    expect(INITIAL_HEATMAP_GRID).toHaveLength(24)
    for (const row of INITIAL_HEATMAP_GRID) {
      expect(row).toHaveLength(60)
    }
  })

  it('generates 5 initial log lines', () => {
    expect(INITIAL_LOGS).toHaveLength(5)
  })

  it('all log levels are valid', () => {
    const VALID_LEVELS = new Set(['info', 'warn', 'error'])
    for (const line of INITIAL_LOGS) {
      expect(VALID_LEVELS.has(line.level)).toBe(true)
    }
  })

  it('all host metrics have valid error rates', () => {
    for (const hm of INITIAL_HOST_METRICS) {
      expect(hm.errorRate).toBeGreaterThanOrEqual(0)
      expect(hm.errorRate).toBeLessThanOrEqual(1)
    }
  })

  it('the backfill window shows an incident over the 500 ms SLO and a calm baseline', () => {
    // The hero chart draws its SLO rule inside the y-domain only if some P99 crosses it.
    const p99s = INITIAL_LATENCY_HISTORY.map((p) => p.p99)
    expect(Math.max(...p99s)).toBeGreaterThan(500)
    expect(Math.min(...p99s)).toBeLessThan(500)
  })

  it('latencySample keeps p50 <= p95 <= p99 and never goes negative, for negative ticks too', () => {
    const rng = { int: (min: number) => min }
    for (let tick = -SPIKE_PERIOD; tick < SPIKE_PERIOD * 2; tick++) {
      const s = latencySample(tick, rng)
      expect(s.p50).toBeGreaterThan(0)
      expect(s.p50).toBeLessThanOrEqual(s.p95)
      expect(s.p95).toBeLessThanOrEqual(s.p99)
    }
  })

  it('every service carries 60-point error and CPU histories', () => {
    for (const hm of INITIAL_HOST_METRICS) {
      expect(hm.errorHistory).toHaveLength(60)
      expect(hm.cpuHistory).toHaveLength(60)
    }
  })

  it('seeds an activity feed, newest first', () => {
    const times = INITIAL_EVENTS.map((e) => e.t)
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })
})
