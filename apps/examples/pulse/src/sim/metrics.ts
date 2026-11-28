import { signal } from '@cascivo/core'
import { createSimulation } from '@cascivo/example-kit'
import { FIRST_LIVE_TICK, HOSTS, INITIAL_EVENTS, latencySample } from '../data/seed'
import type { LatencyPoint, HostMetric, Alert, LogLine, PulseEvent } from '../data/seed'
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
/** Newest first: deploys, pages and recoveries for the overview's activity feed. */
export const events = signal<PulseEvent[]>(INITIAL_EVENTS)

const SERVICE_LATENCY_SCALE = [0.85, 1.2, 0.95, 0.6]

let tick = FIRST_LIVE_TICK
let eventCounter = 0

function pushEvent(event: Omit<PulseEvent, 'id'>) {
  events.value = [{ ...event, id: `ev-live-${++eventCounter}` }, ...events.value].slice(0, 8)
}

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
    const { p50, p95, p99 } = latencySample(tick++, rng)
    latencyHistory.value = [...latencyHistory.value.slice(-59), { t: now, p50, p95, p99 }]

    // Update heatmap — increment a random cell
    const hour = new Date(now).getHours()
    const minute = new Date(now).getMinutes()
    const newGrid = heatmapGrid.value.map((row, h) =>
      h === hour ? row.map((v, m) => (m === minute ? Math.min(200, v + rng.int(1, 10)) : v)) : row,
    )
    heatmapGrid.value = newGrid

    // Update host metrics
    // Each service tracks the fleet's latency at its own scale (checkout is the slow one), so
    // a fleet-wide incident shows up per service too and nothing drifts off on its own.
    const newHostMetrics: HostMetric[] = hostMetrics.value.map((hm, index) => {
      const scale = SERVICE_LATENCY_SCALE[index] ?? 1
      const newP50 = Math.max(10, Math.round(p50 * scale + rng.int(-8, 8)))
      const newP95 = Math.max(newP50 + 10, Math.round(p95 * scale + rng.int(-15, 15)))
      const newP99 = Math.max(newP95 + 10, Math.round(p99 * scale + rng.int(-20, 20)))
      // Mean-reverting walks: a plain random walk drifts to a clamp and sits there.
      const meanRps =
        (hm.rpsHistory.reduce((s, v) => s + v, 0) || hm.rps) / (hm.rpsHistory.length || 1)
      const newRps = Math.max(10, Math.round(hm.rps + (meanRps - hm.rps) * 0.2 + rng.int(-30, 30)))
      const newErrorRate = Math.max(
        0,
        Math.min(0.03, hm.errorRate + (0.005 - hm.errorRate) * 0.1 + (rng.next() - 0.5) * 0.003),
      )
      const newCpu = Math.max(
        5,
        Math.min(95, hm.cpu + Math.round((45 - hm.cpu) * 0.1) + rng.int(-5, 5)),
      )
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
        errorHistory: [...hm.errorHistory.slice(-59), newErrorRate],
        cpuHistory: [...hm.cpuHistory.slice(-59), newCpu],
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
        pushEvent({
          kind: 'incident',
          title: 'P99 latency above 500 ms',
          service: hm.host.id,
          t: now,
        })
      } else if (hm.p99 <= 500 && hasP99Alert) {
        const idx = currentAlerts.findIndex((a) => a.id === p99AlertId)
        if (idx >= 0) currentAlerts.splice(idx, 1)
        pushEvent({ kind: 'resolved', title: 'P99 back under SLO', service: hm.host.id, t: now })
      }

      if (hm.errorRate > 0.01 && !hasErrAlert) {
        currentAlerts.push({
          id: errAlertId,
          severity: 'warning',
          message: `Error rate exceeded 1% (${(hm.errorRate * 100).toFixed(2)}%)`,
          host: hm.host.id,
          t: now,
        })
        pushEvent({ kind: 'incident', title: 'Error rate above 1%', service: hm.host.id, t: now })
      } else if (hm.errorRate <= 0.01 && hasErrAlert) {
        const idx = currentAlerts.findIndex((a) => a.id === errAlertId)
        if (idx >= 0) currentAlerts.splice(idx, 1)
        pushEvent({ kind: 'resolved', title: 'Error rate recovered', service: hm.host.id, t: now })
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
