'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { LineChart, Heatmap, Sparkline } from '@cascivo/charts'
import { latencyHistory, heatmapGrid, hostMetrics } from '../sim/metrics'
import { msg } from '../i18n'
import type { HostMetric } from '../data/seed'

type LatencyDatum = { t: number; y: number }

export function Metrics() {
  useSignals()

  const history = latencyHistory.value
  const grid = heatmapGrid.value
  const hosts = hostMetrics.value

  const p50Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p50 }))
  const p95Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p95 }))
  const p99Data: LatencyDatum[] = history.map((d) => ({ t: d.t, y: d.p99 }))

  // Heatmap: flatten 24×60 grid to HeatmapDatum[]
  const heatmapData = grid.flatMap((row, h) =>
    row.map((value, m) => ({
      x: String(m).padStart(2, '0'),
      y: String(h).padStart(2, '0'),
      value,
    })),
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-6)',
        padding: 'var(--cascivo-space-6)',
      }}
    >
      {/* Latency line charts — one per percentile */}
      <section>
        <h2
          style={{
            fontSize: 'var(--cascivo-text-base)',
            fontWeight: 600,
            marginBottom: 'var(--cascivo-space-3)',
            color: 'var(--cascivo-color-foreground)',
          }}
        >
          {t(msg.sectionLatency)}
        </h2>
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
            height={220}
            tooltip
          />
          <LineChart<LatencyDatum>
            title={t(msg.seriesP95)}
            series={[{ id: 'p95', label: t(msg.seriesP95), data: p95Data }]}
            x={(d) => d.t}
            y={(d) => d.y}
            height={220}
            tooltip
          />
          <LineChart<LatencyDatum>
            title={t(msg.seriesP99)}
            series={[{ id: 'p99', label: t(msg.seriesP99), data: p99Data }]}
            x={(d) => d.t}
            y={(d) => d.y}
            height={220}
            tooltip
          />
        </div>
      </section>

      {/* Heatmap — request density by hour × minute */}
      <section>
        <h2
          style={{
            fontSize: 'var(--cascivo-text-base)',
            fontWeight: 600,
            marginBottom: 'var(--cascivo-space-3)',
            color: 'var(--cascivo-color-foreground)',
          }}
        >
          {t(msg.sectionHeatmap)}
        </h2>
        <Heatmap title={t(msg.sectionHeatmap)} data={heatmapData} height={220} />
      </section>

      {/* Per-host sparklines */}
      <section>
        <h2
          style={{
            fontSize: 'var(--cascivo-text-base)',
            fontWeight: 600,
            marginBottom: 'var(--cascivo-space-3)',
            color: 'var(--cascivo-color-foreground)',
          }}
        >
          {t(msg.sectionHosts)}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--cascivo-space-4)',
          }}
        >
          {hosts.map((hm) => (
            <HostCard key={hm.host.id} hm={hm} />
          ))}
        </div>
      </section>
    </div>
  )
}

function HostCard({ hm }: { hm: HostMetric }) {
  return (
    <div
      style={{
        padding: 'var(--cascivo-space-4)',
        background: 'var(--cascivo-surface-subtle)',
        borderRadius: 'var(--cascivo-radius-md)',
        border: '1px solid var(--cascivo-color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cascivo-space-3)',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: 'var(--cascivo-text-sm)',
          color: 'var(--cascivo-color-foreground)',
        }}
      >
        {hm.host.name}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--cascivo-space-1)',
          fontSize: 'var(--cascivo-text-xs)',
          color: 'var(--cascivo-color-foreground-muted)',
        }}
      >
        <span>P99: {hm.p99}ms</span>
        <span>RPS: {hm.rps}</span>
        <span>CPU: {hm.cpu}%</span>
        <span>Err: {(hm.errorRate * 100).toFixed(2)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 'var(--cascivo-space-3)', alignItems: 'flex-end' }}>
        <div>
          <div
            style={{
              fontSize: 'var(--cascivo-text-xs)',
              color: 'var(--cascivo-color-foreground-muted)',
              marginBottom: 2,
            }}
          >
            P99
          </div>
          <Sparkline
            data={hm.p99History}
            label={`${hm.host.name} P99`}
            width={100}
            height={36}
            color="var(--cascivo-chart-3)"
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 'var(--cascivo-text-xs)',
              color: 'var(--cascivo-color-foreground-muted)',
              marginBottom: 2,
            }}
          >
            RPS
          </div>
          <Sparkline
            data={hm.rpsHistory}
            label={`${hm.host.name} RPS`}
            width={100}
            height={36}
            color="var(--cascivo-chart-1)"
          />
        </div>
      </div>
    </div>
  )
}
