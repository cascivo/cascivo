import { Badge } from '@cascade-ui/components/badge'
import { Card } from '@cascade-ui/components/card'
import registry from '../../../../registry.json'

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
        gap: 'var(--cascade-space-6)',
        background: 'var(--cascade-color-bg)',
        padding: 'var(--cascade-space-16)',
      }}
    >
      <Badge variant="outline">{componentCount}+ components · 5 themes · MIT</Badge>
      <h1
        style={{
          fontFamily: 'var(--cascade-font-sans)',
          fontSize: '3.5rem',
          fontWeight: 700,
          color: 'var(--cascade-color-text)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Native to the web.{' '}
        <span style={{ color: 'var(--cascade-color-accent)' }}>Fluent in agent.</span>
      </h1>
      <p
        style={{
          fontFamily: 'var(--cascade-font-sans)',
          fontSize: '1.25rem',
          color: 'var(--cascade-color-text-subtle)',
          margin: 0,
          textAlign: 'center',
          maxWidth: '56rem',
        }}
      >
        cascade — CSS-native. Signal-driven. AI-first.
      </p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--cascade-space-4)',
          marginTop: 'var(--cascade-space-4)',
        }}
      >
        {(['Requests · 24h', 'p99 latency', 'Error rate'] as const).map((label, i) => (
          <Card key={label} padding="sm">
            <span
              style={{
                fontFamily: 'var(--cascade-font-mono)',
                fontSize: 'var(--cascade-text-xs)',
                color: 'var(--cascade-color-text-subtle)',
                display: 'block',
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: 'var(--cascade-font-mono)',
                fontSize: 'var(--cascade-text-2xl)',
                fontWeight: 600,
                color: 'var(--cascade-color-text)',
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
