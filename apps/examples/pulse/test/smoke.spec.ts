import { describe, it, expect } from 'vitest'
import {
  HOSTS,
  INITIAL_LATENCY_HISTORY,
  INITIAL_HOST_METRICS,
  INITIAL_HEATMAP_GRID,
  INITIAL_LOGS,
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
})
