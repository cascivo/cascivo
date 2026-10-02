'use client'
import { useSignals } from '@cascivo/core'
import type { ReactNode } from 'react'
import { t } from '@cascivo/i18n'
import { AreaChart } from '@cascivo/charts'
import { SloStrip } from './SloStrip'
import { latencyHistory, hostMetrics } from '../sim/metrics'
import { msg } from '../i18n'

type LatencyDatum = { t: number; y: number }

// One palette hue per percentile, so the three charts read apart at a glance and every
// theme (including the landing's brutalist embed) recolours them.
const P50_COLOR = 'var(--cascivo-chart-2)'
const P95_COLOR = 'var(--cascivo-chart-1)'
const P99_COLOR = 'var(--cascivo-chart-6)'

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
        <KpiCard label="Total RPS" value={String(totalRps)} accent={P50_COLOR} />
        <KpiCard label="Avg P99" value={`${avgP99}ms`} accent={P99_COLOR} />
        <KpiCard
          label="Avg Error"
          value={`${(avgError * 100).toFixed(2)}%`}
          accent="var(--cascivo-color-error)"
        />
        <KpiCard label="Hosts" value={String(hosts.length)} accent={P95_COLOR} />
      </div>

      {/* SLO strip — above the fold */}
      <SloStrip />

      {/* Latency overview — three single-series area charts side by side, one hue each */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--cascivo-space-4)',
        }}
      >
        <ChartPanel title={t(msg.seriesP50)} color={P50_COLOR}>
          <AreaChart<LatencyDatum>
            title={t(msg.seriesP50)}
            series={[{ id: 'p50', label: t(msg.seriesP50), data: p50Data, color: P50_COLOR }]}
            x={(d) => new Date(d.t)}
            y={(d) => d.y}
            height={180}
            fill="gradient"
            tooltip
          />
        </ChartPanel>
        <ChartPanel title={t(msg.seriesP95)} color={P95_COLOR}>
          <AreaChart<LatencyDatum>
            title={t(msg.seriesP95)}
            series={[{ id: 'p95', label: t(msg.seriesP95), data: p95Data, color: P95_COLOR }]}
            x={(d) => new Date(d.t)}
            y={(d) => d.y}
            height={180}
            fill="gradient"
            tooltip
          />
        </ChartPanel>
        <ChartPanel title={t(msg.seriesP99)} color={P99_COLOR}>
          <AreaChart<LatencyDatum>
            title={t(msg.seriesP99)}
            series={[{ id: 'p99', label: t(msg.seriesP99), data: p99Data, color: P99_COLOR }]}
            x={(d) => new Date(d.t)}
            y={(d) => d.y}
            height={180}
            fill="gradient"
            tooltip
          />
        </ChartPanel>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        padding: 'var(--cascivo-space-4)',
        background: 'var(--cascivo-color-surface)',
        borderRadius: 'var(--cascivo-radius-md)',
        border: '1px solid var(--cascivo-color-border)',
        borderBlockStart: `4px solid ${accent}`,
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

function ChartPanel({
  title,
  color,
  children,
}: {
  title: string
  color: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-3)',
        padding: 'var(--cascivo-space-4)',
        background: 'var(--cascivo-color-surface)',
        borderRadius: 'var(--cascivo-radius-md)',
        border: '1px solid var(--cascivo-color-border)',
      }}
    >
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cascivo-space-2)',
          fontSize: 'var(--cascivo-text-xs)',
          fontWeight: 600,
          color: 'var(--cascivo-color-foreground-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span
          aria-hidden="true"
          style={{ inlineSize: '0.625rem', blockSize: '0.625rem', background: color }}
        />
        {title}
      </h2>
      {children}
    </section>
  )
}
