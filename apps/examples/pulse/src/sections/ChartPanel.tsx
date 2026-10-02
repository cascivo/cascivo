import type { ReactNode } from 'react'

// One palette hue per percentile, so the three charts read apart at a glance and every
// theme (including the landing's brutalist embed) recolours them.
export const P50_COLOR = 'var(--cascivo-chart-2)'
export const P95_COLOR = 'var(--cascivo-chart-1)'
export const P99_COLOR = 'var(--cascivo-chart-6)'

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
