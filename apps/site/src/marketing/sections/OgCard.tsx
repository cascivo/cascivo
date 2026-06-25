import { Badge } from '@cascivo/components/badge'
import { Card } from '@cascivo/components/card'
import registry from '../../../../../registry.json'

const componentCount = (registry as { components: unknown[] }).components.length

export function OgCard() {
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
      <Badge variant="outline">
        {componentCount}+ components · {__CASCIVO_THEME_COUNT__} themes · MIT
      </Badge>
      <h1
        style={{
          fontFamily: 'var(--cascivo-font-sans)',
          fontSize: '3.5rem',
          fontWeight: 700,
          color: 'var(--cascivo-color-text)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Native to the web.{' '}
        <span style={{ color: 'var(--cascivo-color-accent)' }}>Fluent in agent.</span>
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
        cascivo — CSS-native. Signal-driven. AI-first.
      </p>
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
    </div>
  )
}
