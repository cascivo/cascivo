import type { ReactNode } from 'react'

// One step of the theme-derived heat ramp per percentile (palette.css): accent for the bulk
// of requests, destructive for the slow tail, so P99 reads first in every theme.
export const P50_COLOR = 'var(--pulse-p50)'
export const P95_COLOR = 'var(--pulse-p95)'
export const P99_COLOR = 'var(--pulse-p99)'

/** A titled surface for one chart, keyed by a swatch in the series colour. */
export function ChartPanel({
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
        borderRadius: 'var(--cascivo-radius-surface)',
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
