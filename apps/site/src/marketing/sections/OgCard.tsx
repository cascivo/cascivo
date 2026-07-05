import { Badge } from '@cascivo/components/badge'
import { Card } from '@cascivo/components/card'
import registry from '../../../../../registry.json'

const componentCount = (registry as { components: unknown[] }).components.length

interface OgSpec {
  eyebrow?: string
  title: string
  accent: string
  sub: string
  /** Home card shows the demo stat tiles; route cards keep it clean. */
  stats?: boolean
}

const HOME: OgSpec = {
  title: 'Native to the web.',
  accent: 'Fluent with agents.',
  sub: 'The React design system you copy in and own — built on modern CSS and signals.',
  stats: true,
}

// Per-route share cards. Keys match the `?r=<key>` param the generator screenshots
// and the ogImage paths in route-head.ts (/og/<key>.png).
const CARDS: Record<string, OgSpec> = {
  performance: {
    eyebrow: 'Performance',
    title: 'Signals, not re-renders.',
    accent: 'Measured, not claimed.',
    sub: 'Fine-grained updates and smaller bundles, benchmarked against popular React UI libraries.',
  },
  charts: {
    eyebrow: 'Charts',
    title: 'Charts, from scratch.',
    accent: 'Zero dependencies.',
    sub: '25 chart types, CVD-safe palettes, keyboard-navigable tooltips — no Recharts.',
  },
  ai: {
    eyebrow: 'AI layer',
    title: 'Not just install —',
    accent: 'select, scaffold, validate.',
    sub: 'Per-component manifests and a semantic MCP that checks the agent’s own output.',
  },
  examples: {
    eyebrow: 'Examples',
    title: 'Drive it,',
    accent: 'don’t read about it.',
    sub: 'Six functional dashboards — Vercel, Stripe, Camunda, Linear, Datadog, Trade Republic — built with cascivo.',
  },
  create: {
    eyebrow: 'Theme builder',
    title: 'Your brand,',
    accent: 'a token swap away.',
    sub: 'Pick a colour and radius, preview on real components, copy the theme — no rebuild.',
  },
}

export function OgCard() {
  const key =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('r') : null
  const spec = (key && CARDS[key]) || HOME

  return (
    <div
      data-theme="dark"
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--cascivo-space-6)',
        background: 'var(--cascivo-color-bg)',
        padding: 'var(--cascivo-space-16)',
      }}
    >
      {spec.eyebrow ? (
        <span
          style={{
            fontFamily: 'var(--cascivo-font-mono)',
            fontSize: 'var(--cascivo-text-sm)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--cascivo-color-accent)',
          }}
        >
          {spec.eyebrow}
        </span>
      ) : (
        <Badge variant="outline">
          {componentCount}+ components · {__CASCIVO_THEME_COUNT__} themes · MIT
        </Badge>
      )}
      <h1
        style={{
          fontFamily: 'var(--cascivo-font-sans)',
          fontSize: '3.5rem',
          fontWeight: 700,
          color: 'var(--cascivo-color-text)',
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {spec.title} <span style={{ color: 'var(--cascivo-color-accent)' }}>{spec.accent}</span>
      </h1>
      <p
        style={{
          fontFamily: 'var(--cascivo-font-sans)',
          fontSize: '1.25rem',
          color: 'var(--cascivo-color-text-subtle)',
          margin: 0,
          textAlign: 'center',
          maxWidth: '56rem',
        }}
      >
        {spec.sub}
      </p>
      {spec.stats && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--cascivo-space-4)',
            marginTop: 'var(--cascivo-space-4)',
          }}
        >
          {(['Requests · 24h', 'p99 latency', 'Error rate'] as const).map((label, i) => (
            <Card key={label} padding="sm">
              <span
                style={{
                  fontFamily: 'var(--cascivo-font-mono)',
                  fontSize: 'var(--cascivo-text-xs)',
                  color: 'var(--cascivo-color-text-subtle)',
                  display: 'block',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--cascivo-font-mono)',
                  fontSize: 'var(--cascivo-text-2xl)',
                  fontWeight: 600,
                  color: 'var(--cascivo-color-text)',
                }}
              >
                {(['4.21M', '182ms', '0.42%'] as const)[i]}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
