// Design Tokens — auto-generated from /tokens.catalog.json (written by
// `pnpm catalog:generate` into public/). Every --cascivo-* token is shown with
// a live, theme-accurate preview; switch the theme toolbar to see values
// resolve. Nothing is hand-listed — add a token and regen to surface it here.
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

interface CatalogToken {
  name: string
  value: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault: string | null
  resolvesPerTheme: boolean
}

interface CatalogFile {
  count: number
  tokens: CatalogToken[]
}

type Kind = 'color' | 'type' | 'size' | 'radius' | 'shadow' | 'value'

interface SectionDef {
  id: string
  label: string
  kind: Kind
  groups: string[]
}

const SECTIONS: SectionDef[] = [
  {
    id: 'color',
    label: 'Colors',
    kind: 'color',
    groups: ['gray', 'blue', 'green', 'red', 'orange', 'yellow', 'warm', 'chart', 'color'],
  },
  {
    id: 'type',
    label: 'Typography',
    kind: 'type',
    groups: ['text', 'font', 'leading', 'tracking'],
  },
  { id: 'space', label: 'Spacing', kind: 'size', groups: ['space'] },
  { id: 'radius', label: 'Radius', kind: 'radius', groups: ['radius'] },
  { id: 'shadow', label: 'Elevation', kind: 'shadow', groups: ['shadow'] },
  { id: 'motion', label: 'Motion', kind: 'value', groups: ['duration', 'ease', 'motion'] },
]
const OTHER: SectionDef = { id: 'other', label: 'Other', kind: 'value', groups: [] }

function sectionFor(token: CatalogToken): SectionDef {
  for (const s of SECTIONS) if (s.groups.includes(token.group)) return s
  return OTHER
}

const previewBox: React.CSSProperties = {
  inlineSize: '3rem',
  blockSize: '3rem',
  borderRadius: 'var(--cascivo-radius-md, 0.5rem)',
  flexShrink: 0,
}

function Preview({ token, kind }: { token: CatalogToken; kind: Kind }) {
  const v = `var(${token.name})`
  switch (kind) {
    case 'color':
      return (
        <div
          style={{ ...previewBox, background: v, border: '1px solid var(--cascivo-color-border)' }}
        />
      )
    case 'radius':
      return (
        <div
          style={{
            ...previewBox,
            borderRadius: v,
            background: 'var(--cascivo-color-surface-2, var(--cascivo-color-surface))',
            border: '1px solid var(--cascivo-color-border)',
          }}
        />
      )
    case 'shadow':
      return (
        <div
          style={{ ...previewBox, background: 'var(--cascivo-color-background)', boxShadow: v }}
        />
      )
    case 'size':
      return (
        <div style={{ ...previewBox, blockSize: 'auto', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              inlineSize: v,
              blockSize: '0.75rem',
              background: 'var(--cascivo-color-accent)',
              borderRadius: '2px',
            }}
          />
        </div>
      )
    case 'type': {
      const s: React.CSSProperties = {
        ...previewBox,
        blockSize: 'auto',
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.25rem',
      }
      if (token.group === 'text') s.fontSize = v
      else if (token.group === 'font') {
        if (/sans|mono|display/.test(token.name)) s.fontFamily = v
        else s.fontWeight = v as React.CSSProperties['fontWeight']
      } else if (token.group === 'leading') s.lineHeight = v
      else if (token.group === 'tracking') s.letterSpacing = v
      return <div style={s}>Ag</div>
    }
    default:
      return (
        <div style={{ ...previewBox, blockSize: 'auto', color: 'var(--cascivo-color-text-muted)' }}>
          —
        </div>
      )
  }
}

function TokenCard({ token, kind }: { token: CatalogToken; kind: Kind }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        border: '1px solid var(--cascivo-color-border-subtle, var(--cascivo-color-border))',
        borderRadius: 'var(--cascivo-radius-md, 0.5rem)',
      }}
    >
      <Preview token={token} kind={kind} />
      <div style={{ minWidth: 0 }}>
        <code style={{ display: 'block', fontSize: '0.8125rem', wordBreak: 'break-all' }}>
          {token.name}
        </code>
        <code
          style={{
            display: 'block',
            color: 'var(--cascivo-color-text-muted)',
            fontSize: '0.75rem',
            wordBreak: 'break-all',
          }}
        >
          {token.resolvedDefault ?? token.value}
        </code>
        <span style={{ fontSize: '0.75rem', color: 'var(--cascivo-color-text-muted)' }}>
          {token.layer}
        </span>
      </div>
    </div>
  )
}

function DesignTokens() {
  const [catalog, setCatalog] = React.useState<CatalogFile | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [layer, setLayer] = React.useState('all')
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    fetch('/tokens.catalog.json')
      .then((r) => {
        if (!r.ok) throw new Error(`tokens.catalog.json: ${r.status}`)
        return r.json() as Promise<CatalogFile>
      })
      .then(setCatalog)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load tokens'))
  }, [])

  if (error) return <div style={{ padding: '1.5rem' }}>Failed to load tokens: {error}</div>
  if (!catalog) return <div style={{ padding: '1.5rem' }}>Loading tokens…</div>

  const q = query.trim().toLowerCase()
  const tokens = catalog.tokens.filter(
    (t) => (layer === 'all' || t.layer === layer) && (q === '' || t.name.toLowerCase().includes(q)),
  )

  return (
    <div
      style={{
        padding: '1.5rem',
        color: 'var(--cascivo-color-text)',
        background: 'var(--cascivo-color-background)',
        fontFamily: 'var(--cascivo-font-sans)',
        minBlockSize: '100vh',
      }}
    >
      <h1 style={{ marginBlockStart: 0 }}>Design Tokens</h1>
      <p style={{ color: 'var(--cascivo-color-text-muted)', maxInlineSize: '46rem' }}>
        The complete, closed set of <code>--cascivo-*</code> custom properties — auto-generated from
        the token sources. Previews are live: use the theme toolbar to see every value resolve.{' '}
        {catalog.count} tokens.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          margin: '1rem 0 1.5rem',
        }}
      >
        <label style={{ fontSize: '0.8125rem' }}>
          <span style={{ display: 'block', marginBlockEnd: '0.25rem' }}>Layer</span>
          <select value={layer} onChange={(e) => setLayer(e.target.value)}>
            {['all', 'primitive', 'semantic', 'component'].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: '0.8125rem', flex: '1 1 16rem' }}>
          <span style={{ display: 'block', marginBlockEnd: '0.25rem' }}>Filter by name</span>
          <input
            type="search"
            placeholder="accent, radius, space…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ inlineSize: '100%' }}
          />
        </label>
      </div>

      {[...SECTIONS, OTHER].map((section) => {
        const items = tokens.filter((t) => sectionFor(t).id === section.id)
        if (items.length === 0) return null
        return (
          <section key={section.id} style={{ marginBlockEnd: '2rem' }}>
            <h2
              style={{
                borderBlockEnd: '1px solid var(--cascivo-color-border)',
                paddingBlockEnd: '0.5rem',
              }}
            >
              {section.label}{' '}
              <span style={{ color: 'var(--cascivo-color-text-muted)', fontWeight: 400 }}>
                ({items.length})
              </span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
                gap: '0.75rem',
              }}
            >
              {items.map((t) => (
                <TokenCard key={t.name} token={t} kind={section.kind} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

const meta: Meta<typeof DesignTokens> = {
  title: 'Design Tokens/Catalog',
  component: DesignTokens,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof DesignTokens>

export const Catalog: Story = {}
