'use client'
import type { CSSProperties, ReactNode } from 'react'
import { useSignals } from '@cascivo/core'
import { currentLocale, t } from '@cascivo/i18n'
import { AlertTriangle, CheckCircle, Layers, Upload } from '@cascivo/icons'
import { AreaChart, Bullet, Heatmap, Meter, Sparkline } from '@cascivo/charts'
import type { AreaChartProps, HeatmapDatum } from '@cascivo/charts'
import { Badge, ProgressBar, ProgressCircle, Status, Timeline } from '@cascivo/react'
import type { TimelineItem } from '@cascivo/react'
import { events, hostMetrics, latencyHistory } from '../sim/metrics'
import { HOSTS } from '../data/seed'
import type { HostMetric, LatencyPoint, PulseEvent } from '../data/seed'
import { P50_COLOR, P95_COLOR, P99_COLOR } from './ChartPanel'
import { KpiTile } from './KpiTile'
import { msg } from '../i18n'
import styles from './Overview.module.css'

const SLO_MS = 500
type LatencyDatum = { t: number; y: number }
type Annotation = NonNullable<AreaChartProps<LatencyDatum>['annotations']>[number]

const mean = (xs: readonly number[]) =>
  xs.length > 0 ? xs.reduce((s, v) => s + v, 0) / xs.length : 0

/** Percent change of the newest point against the mean of the 30 before it, one decimal. */
function deltaPct(series: readonly number[]): number {
  const last = series[series.length - 1] ?? 0
  const base = mean(series.slice(-31, -1))
  return base === 0 ? 0 : Math.round(((last - base) / base) * 1000) / 10
}

/** Element-wise sum (or mean) of per-service histories, aligned on their newest point. */
function combine(rows: readonly (readonly number[])[], op: 'sum' | 'mean'): number[] {
  const len = Math.min(...rows.map((r) => r.length))
  return Array.from({ length: len }, (_, i) => {
    const vals = rows.map((r) => r[r.length - len + i] ?? 0)
    return op === 'sum' ? vals.reduce((s, v) => s + v, 0) : mean(vals)
  })
}

const rise = (i: number) => ({ '--i': i }) as CSSProperties

export function Overview() {
  useSignals()

  const history = latencyHistory.value
  const hosts = hostMetrics.value
  // Same predicate as the services table and the sidebar's region health, so the page never
  // says "operational" beside a failing service.
  const failing = hosts.filter((h) => statusOf(h) === 'danger').length

  const rpsSeries = combine(
    hosts.map((h) => h.rpsHistory),
    'sum',
  )
  const errSeries = combine(
    hosts.map((h) => h.errorHistory),
    'mean',
  ).map((e) => e * 100)
  const cpuSeries = combine(
    hosts.map((h) => h.cpuHistory),
    'mean',
  )
  const p99Series = history.map((d) => d.p99)

  const totalRps = rpsSeries[rpsSeries.length - 1] ?? 0
  const errNow = errSeries[errSeries.length - 1] ?? 0
  const cpuNow = cpuSeries[cpuSeries.length - 1] ?? 0
  const latest = history[history.length - 1]
  const compliance = Math.round(
    (history.filter((d) => d.p99 < SLO_MS).length / Math.max(1, history.length)) * 100,
  )
  // Mock 30-day budget, nudged by the live error rate so it visibly breathes.
  const budget = Math.max(0, Math.min(100, Math.round(86 - errNow * 25)))
  const availability = 100 - errNow / 10

  const regions = new Set(HOSTS.map((h) => h.region)).size
  const nf = new Intl.NumberFormat(currentLocale(), { maximumFractionDigits: 0 })

  return (
    <div className={styles['root']}>
      <div className={styles['stack']}>
        <header className={styles['head']}>
          <div>
            <p className={styles['eyebrow']}>
              {t(msg.overviewEyebrow, { services: HOSTS.length, regions })}
            </p>
            <h1 className={styles['title']}>{t(msg.overviewTitle)}</h1>
          </div>
          <div className={styles['headMeta']}>
            <Status status={failing > 0 ? 'warning' : 'success'} pulse>
              {failing > 0 ? t(msg.healthDegraded, { count: failing }) : t(msg.healthOk)}
            </Status>
            <Badge variant="outline">{t(msg.mockData)}</Badge>
          </div>
        </header>

        <section className={styles['kpis']} aria-label={t(msg.overviewTitle)}>
          <KpiTile
            index={0}
            label={t(msg.kpiThroughput)}
            value={nf.format(totalRps)}
            unit={t(msg.unitRps)}
            delta={deltaPct(rpsSeries)}
            goodDirection="up"
            series={rpsSeries.slice(-40)}
            format={(v) => nf.format(v)}
          />
          <KpiTile
            index={1}
            label={t(msg.kpiP99)}
            value={nf.format(latest?.p99 ?? 0)}
            unit="ms"
            delta={deltaPct(p99Series)}
            goodDirection="down"
            series={p99Series.slice(-40)}
            format={(v) => nf.format(v)}
            target={SLO_MS}
          />
          <KpiTile
            index={2}
            label={t(msg.kpiErrorRate)}
            value={errNow.toFixed(2)}
            unit="%"
            delta={deltaPct(errSeries)}
            goodDirection="down"
            series={errSeries.slice(-40)}
            format={(v) => `${v.toFixed(2)}%`}
            target={1}
          />
          <KpiTile
            index={3}
            label={t(msg.kpiCpu)}
            value={String(Math.round(cpuNow))}
            unit="%"
            delta={deltaPct(cpuSeries)}
            goodDirection="down"
            series={cpuSeries.slice(-40)}
            format={(v) => `${Math.round(v)}%`}
            target={80}
          />
        </section>

        <div className={styles['band']}>
          <LatencyHero history={history} />
          <Panel index={5} title={t(msg.budgetTitle)} subtitle={t(msg.budgetSubtitle)}>
            <div className={styles['budget']}>
              <ProgressCircle value={budget} max={100} size="lg" label={t(msg.budgetLeft)} />
              <div>
                <div className={styles['budgetValue']}>{budget}%</div>
                <div className={styles['panelSub']}>{t(msg.budgetLeftCaption)}</div>
              </div>
            </div>
            <div className={styles['objectives']}>
              <ProgressBar
                value={compliance}
                max={100}
                size="sm"
                label={t(msg.sloCompliance)}
                helperText={t(msg.sloComplianceValue, { pct: compliance })}
                status={compliance >= 90 ? 'success' : 'error'}
              />
              <div className={styles['objective']}>
                <div className={styles['objectiveHead']}>
                  <span>{t(msg.sloErrorTarget)}</span>
                  <span>{errNow.toFixed(2)}%</span>
                </div>
                <Meter
                  value={Number(errNow.toFixed(2))}
                  min={0}
                  max={2}
                  label={t(msg.sloErrorTarget)}
                  variant="bar"
                  thresholds={{ warning: 0.7, critical: 1 }}
                />
              </div>
              <div className={styles['objective']}>
                <div className={styles['objectiveHead']}>
                  <span>{t(msg.availability)}</span>
                  <span>{availability.toFixed(3)}%</span>
                </div>
                <Bullet
                  value={availability}
                  target={99.9}
                  ranges={[99.5, 99.8, 100]}
                  min={99}
                  max={100}
                  label={t(msg.availability)}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className={styles['band']}>
          <Panel index={6} title={t(msg.servicesTitle)} subtitle={t(msg.servicesSubtitle)}>
            <ServicesTable hosts={hosts} />
          </Panel>
          <Panel index={7} title={t(msg.feedTitle)} subtitle={t(msg.feedSubtitle)}>
            <Timeline items={events.value.slice(0, 4).map(toTimelineItem)} />
          </Panel>
        </div>

        <Panel index={8} title={t(msg.distributionTitle)} subtitle={t(msg.distributionSubtitle)}>
          <div className={styles['heat']}>
            <Heatmap
              title={t(msg.distributionTitle)}
              data={distribution(history.slice(-30))}
              height={220}
            />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Panel({
  index,
  title,
  subtitle,
  actions,
  children,
}: {
  index: number
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`${styles['panel']} ${styles['rise']}`} style={rise(index)}>
      <div className={styles['panelHead']}>
        <div>
          <h2 className={styles['panelTitle']}>{title}</h2>
          {subtitle && <p className={styles['panelSub']}>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

// Back to front, slowest first: three translucent gradient bands layered like heat, P99 behind
// so every band stays visible. Each also has a labelled readout, so none rests on hue.
const SERIES = [
  { id: 'p99', label: msg.seriesP99, color: P99_COLOR, line: 'var(--pulse-p99-line)' },
  { id: 'p95', label: msg.seriesP95, color: P95_COLOR, line: 'var(--pulse-p95-line)' },
  { id: 'p50', label: msg.seriesP50, color: P50_COLOR, line: 'var(--pulse-p50-line)' },
] as const

/**
 * The SLO as a rule, the zone above it, each breach window as a band, and a ringed marker on
 * each breach peak, all from the hot end of the ramp. The highest peak also gets a note in ink,
 * so the worst moment is labelled in words, not only shown in red.
 */
function sloAnnotations(history: LatencyPoint[], sloLabel: string): Annotation[] {
  // Consecutive samples over the objective merge into one window.
  const windows: { from: number; to: number }[] = []
  history.forEach((d, i) => {
    if (d.p99 <= SLO_MS) return
    const open = windows[windows.length - 1]
    if (open && (history[i - 1]?.p99 ?? 0) > SLO_MS) open.to = d.t
    else windows.push({ from: d.t, to: d.t })
  })
  const peaks = history.filter((d, i) => {
    const prev = history[i - 1]?.p99 ?? 0
    const next = history[i + 1]?.p99 ?? 0
    return d.p99 > SLO_MS && d.p99 >= prev && d.p99 > next
  })
  const worst = peaks.reduce<LatencyPoint | undefined>(
    (m, d) => (m && m.p99 >= d.p99 ? m : d),
    undefined,
  )
  return [
    { kind: 'threshold', value: SLO_MS, side: 'above', color: 'var(--pulse-p99)' },
    ...windows.map((w): Annotation => ({
      kind: 'area',
      axis: 'x',
      from: new Date(w.from),
      to: new Date(w.to),
      color: 'var(--pulse-p99)',
    })),
    {
      kind: 'line',
      axis: 'y',
      value: SLO_MS,
      label: sloLabel,
      color: 'var(--cascivo-color-foreground)',
    },
    ...peaks.map((d): Annotation => ({
      kind: 'dot',
      x: new Date(d.t),
      y: d.p99,
      color: 'var(--pulse-p99-line)',
    })),
    ...(worst
      ? [
          {
            kind: 'note',
            x: new Date(worst.t),
            y: worst.p99,
            label: t(msg.heroBreach, { value: worst.p99 }),
            dx: 28,
            dy: 6,
            color: 'var(--cascivo-color-foreground)',
          } satisfies Annotation,
        ]
      : []),
  ]
}

function LatencyHero({ history }: { history: LatencyPoint[] }) {
  const latest = history[history.length - 1]
  // Back to front: the widest percentile behind, so every band stays visible.
  const series = SERIES.map((s) => ({
    id: s.id,
    label: t(s.label),
    color: s.color,
    data: history.map((d): LatencyDatum => ({ t: d.t, y: d[s.id] })),
  }))
  return (
    <Panel
      index={4}
      title={t(msg.heroTitle)}
      subtitle={t(msg.heroSubtitle)}
      actions={
        <div className={styles['readouts']}>
          {[...SERIES].reverse().map((s) => (
            <div key={s.id} className={styles['readout']}>
              <span className={styles['readoutLabel']}>
                <span
                  aria-hidden="true"
                  className={styles['swatch']}
                  style={{ '--swatch': s.color, '--swatch-line': s.line } as CSSProperties}
                />
                {t(s.label)}
              </span>
              <span className={styles['readoutValue']}>
                {latest?.[s.id] ?? 0}
                <span className={styles['unit']}>ms</span>
              </span>
            </div>
          ))}
        </div>
      }
    >
      <div className={styles['heroPlot']}>
        <AreaChart<LatencyDatum>
          title={t(msg.heroTitle)}
          series={series}
          x={(d) => new Date(d.t)}
          y={(d) => d.y}
          height={300}
          fill="gradient"
          curve="monotone"
          legend={false}
          annotations={sloAnnotations(history, t(msg.sloLine))}
          tooltip
          tooltipMode="axis"
        />
      </div>
    </Panel>
  )
}

function statusOf(hm: HostMetric): 'success' | 'warning' | 'danger' {
  if (hm.p99 > SLO_MS || hm.errorRate > 0.01) return 'danger'
  if (hm.p99 > SLO_MS * 0.8 || hm.errorRate > 0.007 || hm.cpu > 80) return 'warning'
  return 'success'
}

const STATUS_LABEL = {
  success: msg.statusHealthy,
  warning: msg.statusDegraded,
  danger: msg.statusCritical,
} as const

function ServicesTable({ hosts }: { hosts: HostMetric[] }) {
  return (
    // A labelled, focusable scroll region: on a phone the table scrolls inside its panel.
    <div
      className={styles['tableScroll']}
      role="region"
      aria-label={t(msg.servicesTitle)}
      tabIndex={0}
    >
      <table className={styles['table']}>
        <thead>
          <tr>
            <th scope="col">{t(msg.colService)}</th>
            <th scope="col" className={styles['num']}>
              {t(msg.colThroughput)}
            </th>
            <th scope="col" className={styles['num']}>
              {t(msg.colP99)}
            </th>
            <th scope="col" className={styles['num']}>
              {t(msg.colErrors)}
            </th>
            <th scope="col">{t(msg.colCpu)}</th>
          </tr>
        </thead>
        <tbody>
          {hosts.map((hm) => {
            const status = statusOf(hm)
            return (
              <tr key={hm.host.id}>
                <td>
                  <div className={styles['service']}>
                    <Status status={status} pulse={status === 'danger'}>
                      <span className={styles['serviceName']}>{hm.host.name}</span>
                    </Status>
                    <span className={styles['serviceMeta']}>
                      {hm.host.region} · {t(STATUS_LABEL[status])}
                    </span>
                  </div>
                </td>
                <td className={styles['num']}>
                  <div className={styles['spark']}>
                    <Sparkline
                      data={hm.rpsHistory.slice(-30)}
                      label={`${hm.host.name} ${t(msg.colThroughput)}`}
                      width={72}
                      height={24}
                    />
                    <span>{hm.rps}</span>
                  </div>
                </td>
                <td className={`${styles['num']} ${hm.p99 > SLO_MS ? styles['bad'] : ''}`}>
                  {hm.p99} ms
                </td>
                <td className={`${styles['num']} ${hm.errorRate > 0.01 ? styles['bad'] : ''}`}>
                  {(hm.errorRate * 100).toFixed(2)}%
                </td>
                <td className={styles['cpu']}>
                  <ProgressBar
                    value={hm.cpu}
                    max={100}
                    size="sm"
                    label={`${hm.host.name} ${t(msg.colCpu)}`}
                    helperText={`${hm.cpu}%`}
                    status={hm.cpu > 80 ? 'error' : 'active'}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const EVENT_TONE = {
  incident: 'danger',
  resolved: 'success',
  deploy: 'neutral',
  scale: 'neutral',
} as const

const EVENT_ICON = {
  incident: <AlertTriangle size={14} />,
  resolved: <CheckCircle size={14} />,
  deploy: <Upload size={14} />,
  scale: <Layers size={14} />,
} as const

function ago(ts: number): string {
  const minutes = Math.round((ts - Date.now()) / 60_000)
  const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto', style: 'short' })
  return Math.abs(minutes) < 60
    ? rtf.format(minutes, 'minute')
    : rtf.format(Math.round(minutes / 60), 'hour')
}

function toTimelineItem(ev: PulseEvent): TimelineItem {
  return {
    id: ev.id,
    title: ev.title,
    description: ev.service,
    time: ago(ev.t),
    icon: EVENT_ICON[ev.kind],
    tone: EVENT_TONE[ev.kind],
    status: 'complete',
  }
}

/** Latency buckets, slowest first so the slow tail sits at the top like a flame. */
const BUCKETS = [
  { label: '>600', lo: 600, hi: 1200 },
  { label: '400–600', lo: 400, hi: 600 },
  { label: '250–400', lo: 250, hi: 400 },
  { label: '150–250', lo: 150, hi: 250 },
  { label: '80–150', lo: 80, hi: 150 },
  { label: '<80', lo: 0, hi: 80 },
] as const

/**
 * Approximate each sample's request distribution from its three percentiles: a piecewise
 * linear CDF through (0,0), (p50,.5), (p95,.95), (p99,.99) and (1.6·p99,1).
 */
function distribution(points: LatencyPoint[]): HeatmapDatum[] {
  const fmt = new Intl.DateTimeFormat(currentLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return points.flatMap((p) => {
    const knots: [number, number][] = [
      [0, 0],
      [p.p50, 0.5],
      [p.p95, 0.95],
      [p.p99, 0.99],
      [p.p99 * 1.6, 1],
    ]
    const cdf = (ms: number) => {
      for (let i = 1; i < knots.length; i++) {
        const [x0, y0] = knots[i - 1] ?? [0, 0]
        const [x1, y1] = knots[i] ?? [0, 0]
        if (ms <= x1) return y0 + ((ms - x0) / (x1 - x0 || 1)) * (y1 - y0)
      }
      return 1
    }
    const x = fmt.format(p.t)
    return BUCKETS.map((b) => ({
      x,
      y: b.label,
      value: Math.round((cdf(b.hi) - cdf(b.lo)) * 1000),
    }))
  })
}
