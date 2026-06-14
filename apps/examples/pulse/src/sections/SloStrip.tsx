'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { ProgressCircle } from '@cascivo/react'
import { Bullet, Meter } from '@cascivo/charts'
import { latencyHistory, hostMetrics } from '../sim/metrics'
import { msg } from '../i18n'

export function SloStrip() {
  useSignals()

  const latest = latencyHistory.value[latencyHistory.value.length - 1]
  const p99 = latest?.p99 ?? 0
  // SLO attainment: ratio of p99 target (500ms). Show how far from the limit we are.
  // value shown = p99 value (lower is better), target = 500ms, max = 700ms for scale
  const p99Pct = Math.min(100, (p99 / 500) * 100)

  const hosts = hostMetrics.value
  const avgErrorRate =
    hosts.length > 0 ? hosts.reduce((s, h) => s + h.errorRate, 0) / hosts.length : 0
  const errorPct = avgErrorRate * 100

  const avgCpu = hosts.length > 0 ? hosts.reduce((s, h) => s + h.cpu, 0) / hosts.length : 0
  const avgMem = hosts.length > 0 ? hosts.reduce((s, h) => s + h.mem, 0) / hosts.length : 0

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--cascivo-space-4)',
        padding: 'var(--cascivo-space-4)',
        background: 'var(--cascivo-surface-subtle)',
        borderRadius: 'var(--cascivo-radius-md)',
        border: '1px solid var(--cascivo-color-border)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cascivo-space-2)' }}>
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            fontWeight: 600,
            color: 'var(--cascivo-color-foreground-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {t(msg.sloP99Target)}
        </span>
        <Meter
          value={Math.round(p99Pct)}
          min={0}
          max={100}
          label={t(msg.sloP99)}
          variant="bar"
          thresholds={{ warning: 80, critical: 95 }}
          width={200}
        />
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          {p99}ms / 500ms target
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cascivo-space-2)' }}>
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            fontWeight: 600,
            color: 'var(--cascivo-color-foreground-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {t(msg.sloErrorTarget)}
        </span>
        <Meter
          value={parseFloat(errorPct.toFixed(3))}
          min={0}
          max={5}
          label={t(msg.sloErrorRate)}
          variant="bar"
          thresholds={{ warning: 0.5, critical: 1 }}
          width={200}
        />
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          {(avgErrorRate * 100).toFixed(2)}% / 1% target
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cascivo-space-2)' }}>
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            fontWeight: 600,
            color: 'var(--cascivo-color-foreground-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Uptime SLO
        </span>
        {/* Bullet: actual uptime vs. target (99.9%) — ranges represent poor/ok/good bands */}
        <Bullet
          value={99.7 + (1 - avgErrorRate) * 0.2}
          target={99.9}
          ranges={[99.5, 99.8, 100]}
          min={99}
          max={100}
          label="Uptime %"
          width={200}
        />
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-foreground-muted)',
          }}
        >
          Target: 99.9%
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cascivo-space-2)',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            fontWeight: 600,
            color: 'var(--cascivo-color-foreground-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {t(msg.hostCpu)} / {t(msg.hostMem)}
        </span>
        <div style={{ display: 'flex', gap: 'var(--cascivo-space-4)' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--cascivo-space-1)',
            }}
          >
            <ProgressCircle
              value={Math.round(avgCpu)}
              max={100}
              size="md"
              showValue
              label={t(msg.hostCpu)}
            />
            <span
              style={{
                fontSize: 'var(--cascivo-text-xs)',
                color: 'var(--cascivo-color-foreground-muted)',
              }}
            >
              {t(msg.hostCpu)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--cascivo-space-1)',
            }}
          >
            <ProgressCircle
              value={Math.round(avgMem)}
              max={100}
              size="md"
              showValue
              label={t(msg.hostMem)}
            />
            <span
              style={{
                fontSize: 'var(--cascivo-text-xs)',
                color: 'var(--cascivo-color-foreground-muted)',
              }}
            >
              {t(msg.hostMem)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
