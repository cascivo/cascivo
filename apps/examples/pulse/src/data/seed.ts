import { seededRandom } from '@cascivo/example-kit'

export interface Host {
  id: string
  name: string
}

export interface HostMetric {
  host: Host
  p50: number
  p95: number
  p99: number
  rps: number
  errorRate: number
  cpu: number
  mem: number
  p50History: number[]
  p95History: number[]
  p99History: number[]
  rpsHistory: number[]
}

export interface LatencyPoint {
  t: number
  p50: number
  p95: number
  p99: number
}

export interface Alert {
  id: string
  severity: 'critical' | 'warning'
  message: string
  host: string
  t: number
}

export interface LogLine {
  id: string
  t: number
  level: 'error' | 'warn' | 'info'
  host: string
  message: string
}

const rng = seededRandom(23)

export const HOSTS: Host[] = [
  { id: 'host-1', name: 'host-1' },
  { id: 'host-2', name: 'host-2' },
  { id: 'host-3', name: 'host-3' },
  { id: 'host-4', name: 'host-4' },
]

const HISTORY_LEN = 60
const now = Date.now()

function makeBackfill(): LatencyPoint[] {
  const pts: LatencyPoint[] = []
  for (let i = 0; i < HISTORY_LEN; i++) {
    const p50 = 80 + rng.int(0, 50)
    const p95 = p50 + rng.int(20, 100)
    const p99 = p95 + rng.int(30, 150)
    pts.push({ t: now - (HISTORY_LEN - i) * 2000, p50, p95, p99 })
  }
  return pts
}

function makeHostMetrics(): HostMetric[] {
  return HOSTS.map((host) => {
    const p50History: number[] = []
    const p95History: number[] = []
    const p99History: number[] = []
    const rpsHistory: number[] = []
    for (let i = 0; i < HISTORY_LEN; i++) {
      const p50 = 60 + rng.int(0, 60)
      const p95 = p50 + rng.int(15, 80)
      const p99 = p95 + rng.int(20, 120)
      const rps = 100 + rng.int(0, 300)
      p50History.push(p50)
      p95History.push(p95)
      p99History.push(p99)
      rpsHistory.push(rps)
    }
    const p50 = p50History[p50History.length - 1] ?? 80
    const p95 = p95History[p95History.length - 1] ?? 150
    const p99 = p99History[p99History.length - 1] ?? 300
    const rps = rpsHistory[rpsHistory.length - 1] ?? 200
    return {
      host,
      p50,
      p95,
      p99,
      rps,
      errorRate: rng.next() * 0.02,
      cpu: 20 + rng.int(0, 60),
      mem: 30 + rng.int(0, 50),
      p50History,
      p95History,
      p99History,
      rpsHistory,
    }
  })
}

function makeHeatmapGrid(): number[][] {
  const grid: number[][] = []
  for (let h = 0; h < 24; h++) {
    const row: number[] = []
    for (let m = 0; m < 60; m++) {
      row.push(rng.int(0, 100))
    }
    grid.push(row)
  }
  return grid
}

function makeInitialLogs(): LogLine[] {
  const levels: LogLine['level'][] = ['info', 'info', 'info', 'warn', 'error']
  const messages = [
    'Request processed successfully',
    'Cache hit ratio: 94%',
    'Health check passed',
    'Slow query detected: 450ms',
    'Connection timeout to downstream',
  ]
  return Array.from({ length: 5 }, (_, i) => ({
    id: `seed-log-${i}`,
    t: now - (5 - i) * 3000,
    level: levels[i] ?? 'info',
    host: HOSTS[i % HOSTS.length]?.id ?? 'host-1',
    message: messages[i] ?? 'Log entry',
  }))
}

export const INITIAL_LATENCY_HISTORY: LatencyPoint[] = makeBackfill()
export const INITIAL_HOST_METRICS: HostMetric[] = makeHostMetrics()
export const INITIAL_HEATMAP_GRID: number[][] = makeHeatmapGrid()
export const INITIAL_LOGS: LogLine[] = makeInitialLogs()
