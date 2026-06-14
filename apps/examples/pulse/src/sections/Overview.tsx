'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { LineChart } from '@cascivo/charts'
import { SloStrip } from './SloStrip'
import { latencyHistory, hostMetrics } from '../sim/metrics'
import { msg } from '../i18n'

type LatencyDatum = { t: number; y: number }

export function Overview() {
  useSignals()

  const history = latencyHistory.value
  const hosts = hostMetrics.value

  const p50Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p50 }))
  const p95Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p95 }))
  const p99Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p99 }))

  const totalRps = hosts.reduce((s, h) => s + h.rps, 0)
  const avgP99 =
    hosts.length > 0 ? Math.round(hosts.reduce((s, h) => s + h.p99, 0) / hosts.length) : 0
  const avgError = hosts.length > 0 ? hosts.reduce((s, h) => s + h.errorRate, 0) / hosts.length : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-6)',
        padding: 'var(--cascivo-space-6)',
      }}
    >
      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--cascivo-space-4)',
        }}
      >
        <KpiCard label="Total RPS" value={String(totalRps)} />
        <KpiCard label="Avg P99" value={`${avgP99}ms`} />
        <KpiCard label="Avg Error" value={`${(avgError * 100).toFixed(2)}%`} />
        <KpiCard label="Hosts" value={String(hosts.length)} />
      </div>

      {/* SLO strip — above the fold */}
      <SloStrip />

      {/* Latency overview — three single-series line charts side by side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--cascivo-space-4)',
        }}
      >
        <LineChart<LatencyDatum>
          title={t(msg.seriesP50)}
          series={[{ id: 'p50', label: t(msg.seriesP50), data: p50Data }]}
          x={(d) => d.t}
          y={(d) => d.y}
          height={200}
          tooltip
        />
        <LineChart<LatencyDatum>
          title={t(msg.seriesP95)}
          series={[{ id: 'p95', label: t(msg.seriesP95), data: p95Data }]}
          x={(d) => d.t}
          y={(d) => d.y}
          height={200}
          tooltip
        />
        <LineChart<LatencyDatum>
          title={t(msg.seriesP99)}
          series={[{ id: 'p99', label: t(msg.seriesP99), data: p99Data }]}
          x={(d) => d.t}
          y={(d) => d.y}
          height={200}
          tooltip
        />
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 'var(--cascivo-space-4)',
        background: 'var(--cascivo-surface-subtle)',
        borderRadius: 'var(--cascivo-radius-md)',
        border: '1px solid var(--cascivo-color-border)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--cascivo-text-xs)',
          color: 'var(--cascivo-color-foreground-muted)',
          marginBottom: 'var(--cascivo-space-1)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--cascivo-text-2xl)',
          fontWeight: 700,
          color: 'var(--cascivo-color-foreground)',
        }}
      >
        {value}
      </div>
    </div>
  )
}
