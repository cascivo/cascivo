import { seededRandom } from '@cascivo/example-kit'

export interface Host {
  id: string
  name: string
  region: string
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
  errorHistory: number[]
  cpuHistory: number[]
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

/** One entry of the overview's activity feed: a deploy, a page, or the page's recovery. */
export interface PulseEvent {
  id: string
  kind: 'deploy' | 'incident' | 'resolved' | 'scale'
  title: string
  service: string
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
  { id: 'api-gateway', name: 'api-gateway', region: 'us-east-1' },
  { id: 'checkout', name: 'checkout', region: 'us-east-1' },
  { id: 'search', name: 'search', region: 'eu-west-1' },
  { id: 'auth', name: 'auth', region: 'eu-west-1' },
]

/** Ticks between two latency incidents; a 60-point window always holds one. */
export const SPIKE_PERIOD = 32
const SPIKE_LEN = 6

/**
 * One global latency sample. A slow incident every {@link SPIKE_PERIOD} ticks pushes P99
 * over the 500 ms SLO, so the hero chart always has something to say and its SLO rule is
 * always inside the y-domain.
 */
export function latencySample(tick: number, rng: { int(min: number, max: number): number }) {
  const phase = ((tick % SPIKE_PERIOD) + SPIKE_PERIOD) % SPIKE_PERIOD
  const spike = phase < SPIKE_LEN ? Math.sin((phase / SPIKE_LEN) * Math.PI) : 0
  const p50 = Math.round(88 + rng.int(0, 22) + spike * 70)
  const p95 = Math.round(p50 * 1.7 + rng.int(0, 30) + spike * 90)
  const p99 = Math.round(p95 * 1.45 + rng.int(0, 40) + spike * 120)
  return { p50, p95, p99 }
}

const HISTORY_LEN = 60
// Shifts the backfill so the incident sits two-thirds along the first frame, not at its edge.
const BACKFILL_OFFSET = 8
/** The tick the live simulation continues from, so its incidents keep the backfill's rhythm. */
export const FIRST_LIVE_TICK = HISTORY_LEN - BACKFILL_OFFSET
const now = Date.now()

function makeBackfill(): LatencyPoint[] {
  const pts: LatencyPoint[] = []
  for (let i = 0; i < HISTORY_LEN; i++) {
    pts.push({ t: now - (HISTORY_LEN - i) * 2000, ...latencySample(i - BACKFILL_OFFSET, rng) })
  }
  return pts
}

function makeHostMetrics(): HostMetric[] {
  return HOSTS.map((host, index) => {
    const p50History: number[] = []
    const p95History: number[] = []
    const p99History: number[] = []
    const rpsHistory: number[] = []
    const errorHistory: number[] = []
    const cpuHistory: number[] = []
    // Each service has its own traffic level, so the table and its sparklines differ.
    const baseRps = [420, 260, 180, 120][index] ?? 150
    let rps = baseRps
    let cpu = 30 + rng.int(0, 30)
    let err = 0.002 + rng.next() * 0.006
    for (let i = 0; i < HISTORY_LEN; i++) {
      const p50 = 60 + rng.int(0, 60)
      const p95 = p50 + rng.int(15, 80)
      const p99 = p95 + rng.int(20, 120)
      rps = Math.max(40, Math.round(rps + (baseRps - rps) * 0.2 + rng.int(-25, 25)))
      cpu = Math.max(8, Math.min(92, cpu + rng.int(-4, 4)))
      err = Math.max(0, Math.min(0.03, err + (rng.next() - 0.5) * 0.002))
      p50History.push(p50)
      p95History.push(p95)
      p99History.push(p99)
      rpsHistory.push(rps)
      errorHistory.push(err)
      cpuHistory.push(cpu)
    }
    const p50 = p50History[p50History.length - 1] ?? 80
    const p95 = p95History[p95History.length - 1] ?? 150
    const p99 = p99History[p99History.length - 1] ?? 300
    return {
      host,
      p50,
      p95,
      p99,
      rps,
      errorRate: err,
      cpu,
      mem: 30 + rng.int(0, 50),
      p50History,
      p95History,
      p99History,
      rpsHistory,
      errorHistory,
      cpuHistory,
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

function makeInitialEvents(): PulseEvent[] {
  const min = 60_000
  return [
    {
      id: 'ev-4',
      kind: 'resolved',
      title: 'P99 back under SLO',
      service: 'checkout',
      t: now - 4 * min,
    },
    {
      id: 'ev-3',
      kind: 'incident',
      title: 'P99 latency above 500 ms',
      service: 'checkout',
      t: now - 11 * min,
    },
    {
      id: 'ev-2',
      kind: 'deploy',
      title: 'Deployed v2.41.0',
      service: 'checkout',
      t: now - 14 * min,
    },
    {
      id: 'ev-1',
      kind: 'scale',
      title: 'Autoscaled 6 → 9 pods',
      service: 'search',
      t: now - 38 * min,
    },
    { id: 'ev-0', kind: 'deploy', title: 'Deployed v1.18.2', service: 'auth', t: now - 72 * min },
  ]
}

export const INITIAL_EVENTS: PulseEvent[] = makeInitialEvents()
export const INITIAL_LATENCY_HISTORY: LatencyPoint[] = makeBackfill()
export const INITIAL_HOST_METRICS: HostMetric[] = makeHostMetrics()
export const INITIAL_HEATMAP_GRID: number[][] = makeHeatmapGrid()
export const INITIAL_LOGS: LogLine[] = makeInitialLogs()
