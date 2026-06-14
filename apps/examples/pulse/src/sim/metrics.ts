import { signal } from '@cascivo/core'
import { createSimulation } from '@cascivo/example-kit'
import { HOSTS } from '../data/seed'
import type { LatencyPoint, HostMetric, Alert, LogLine } from '../data/seed'
import {
  INITIAL_LATENCY_HISTORY,
  INITIAL_HOST_METRICS,
  INITIAL_HEATMAP_GRID,
  INITIAL_LOGS,
} from '../data/seed'

export const latencyHistory = signal<LatencyPoint[]>(INITIAL_LATENCY_HISTORY)
export const heatmapGrid = signal<number[][]>(INITIAL_HEATMAP_GRID)
export const hostMetrics = signal<HostMetric[]>(INITIAL_HOST_METRICS)
export const alerts = signal<Alert[]>([])
export const logs = signal<LogLine[]>(INITIAL_LOGS)

const LOG_MESSAGES_INFO = [
  'Request processed successfully',
  'Cache hit ratio: {r}%',
  'Health check passed',
  'Connection pool: {r} available',
  'Metrics collected',
  'Config reloaded',
  'Scheduled job completed',
]

const LOG_MESSAGES_WARN = [
  'Slow query detected: {r}ms',
  'High memory usage: {r}%',
  'Retry attempt {r} for downstream',
  'Response time degraded: {r}ms',
]

const LOG_MESSAGES_ERROR = [
  'Connection timeout to downstream',
  'Unhandled exception in handler',
  'Circuit breaker opened',
  'Failed health check',
]

let logCounter = 100

export const metricsSim = createSimulation({
  tickMs: 2000,
  seed: 23,
  onTick(rng) {
    const now = Date.now()

    // Update global latency history (sliding window of 60 points)
    const p50 = 80 + rng.int(0, 50)
    const p95 = p50 + rng.int(20, 100)
    const p99 = p95 + rng.int(30, 150)
    latencyHistory.value = [...latencyHistory.value.slice(-59), { t: now, p50, p95, p99 }]

    // Update heatmap — increment a random cell
    const hour = new Date(now).getHours()
    const minute = new Date(now).getMinutes()
    const newGrid = heatmapGrid.value.map((row, h) =>
      h === hour ? row.map((v, m) => (m === minute ? Math.min(200, v + rng.int(1, 10)) : v)) : row,
    )
    heatmapGrid.value = newGrid

    // Update host metrics
    const newHostMetrics: HostMetric[] = hostMetrics.value.map((hm) => {
      const newP50 = Math.max(10, hm.p50 + rng.int(-15, 20))
      const newP95 = Math.max(newP50 + 10, hm.p95 + rng.int(-20, 30))
      const newP99 = Math.max(newP95 + 10, hm.p99 + rng.int(-25, 50))
      const newRps = Math.max(10, hm.rps + rng.int(-30, 40))
      const newErrorRate = Math.max(0, Math.min(0.1, hm.errorRate + (rng.next() - 0.5) * 0.005))
      const newCpu = Math.max(5, Math.min(99, hm.cpu + rng.int(-5, 8)))
      const newMem = Math.max(10, Math.min(95, hm.mem + rng.int(-3, 5)))
      return {
        ...hm,
        p50: newP50,
        p95: newP95,
        p99: newP99,
        rps: newRps,
        errorRate: newErrorRate,
        cpu: newCpu,
        mem: newMem,
        p50History: [...hm.p50History.slice(-59), newP50],
        p95History: [...hm.p95History.slice(-59), newP95],
        p99History: [...hm.p99History.slice(-59), newP99],
        rpsHistory: [...hm.rpsHistory.slice(-59), newRps],
      }
    })
    hostMetrics.value = newHostMetrics

    // Fire/clear alerts based on thresholds
    const currentAlerts: Alert[] = [...alerts.value]
    for (const hm of newHostMetrics) {
      const p99AlertId = `p99-${hm.host.id}`
      const errAlertId = `err-${hm.host.id}`
      const hasP99Alert = currentAlerts.some((a) => a.id === p99AlertId)
      const hasErrAlert = currentAlerts.some((a) => a.id === errAlertId)

      if (hm.p99 > 500 && !hasP99Alert) {
        currentAlerts.push({
          id: p99AlertId,
          severity: 'critical',
          message: `P99 latency exceeded 500ms (${hm.p99}ms)`,
          host: hm.host.id,
          t: now,
        })
      } else if (hm.p99 <= 500 && hasP99Alert) {
        const idx = currentAlerts.findIndex((a) => a.id === p99AlertId)
        if (idx >= 0) currentAlerts.splice(idx, 1)
      }

      if (hm.errorRate > 0.01 && !hasErrAlert) {
        currentAlerts.push({
          id: errAlertId,
          severity: 'warning',
          message: `Error rate exceeded 1% (${(hm.errorRate * 100).toFixed(2)}%)`,
          host: hm.host.id,
          t: now,
        })
      } else if (hm.errorRate <= 0.01 && hasErrAlert) {
        const idx = currentAlerts.findIndex((a) => a.id === errAlertId)
        if (idx >= 0) currentAlerts.splice(idx, 1)
      }
    }
    alerts.value = currentAlerts

    // Append a log line
    const levelRoll = rng.next()
    const level: LogLine['level'] = levelRoll > 0.95 ? 'error' : levelRoll > 0.85 ? 'warn' : 'info'
    const host = rng.pick(HOSTS)
    const r = rng.int(10, 99)
    let message: string
    if (level === 'error') {
      message = rng.pick(LOG_MESSAGES_ERROR)
    } else if (level === 'warn') {
      message = (rng.pick(LOG_MESSAGES_WARN) as string).replace('{r}', String(r))
    } else {
      message = (rng.pick(LOG_MESSAGES_INFO) as string).replace('{r}', String(r))
    }

    const newLog: LogLine = {
      id: `log-${++logCounter}`,
      t: now,
      level,
      host: host.id,
      message,
    }
    // Cap at 200 lines
    logs.value = [...logs.value.slice(-199), newLog]
  },
})
