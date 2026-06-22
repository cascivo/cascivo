// Design Tokens page — auto-generated from /tokens.catalog.json (built by
// `pnpm catalog:generate`). Renders every --cascivo-* token grouped into
// sections with a live, theme-accurate preview. Nothing here is hand-listed:
// add a token to the CSS sources, run regen, and it shows up.
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import type { JSX } from 'preact'

interface CatalogToken {
  name: string
  value: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault: string | null
  resolvesPerTheme: boolean
}

interface CatalogFile {
  generatedAt: string
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

// Section order mirrors the Camunda design-tokens layout: colour first, then
// type, spacing, radius, elevation, motion, and a catch-all.
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

function sectionFor(token: CatalogToken): SectionDef {
  for (const s of SECTIONS) if (s.groups.includes(token.group)) return s
  return { id: 'other', label: 'Other', kind: 'value', groups: [] }
}

const previewBox: JSX.CSSProperties = {
  inlineSize: '3rem',
  blockSize: '3rem',
  borderRadius: 'var(--cascivo-radius-md, 0.5rem)',
  flexShrink: 0,
}

/** A live preview for a token, using var() so it reflects the active theme. */
function Preview({ token, kind }: { token: CatalogToken; kind: Kind }): JSX.Element {
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
      const s: JSX.CSSProperties = {
        ...previewBox,
        blockSize: 'auto',
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.25rem',
      }
      if (token.group === 'text') s.fontSize = v
      else if (token.group === 'font') {
        if (/sans|mono|display/.test(token.name)) s.fontFamily = v
        else s.fontWeight = v as string
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

export function TokensPage() {
  useSignals()
  const loading = useSignal(true)
  const error = useSignal<string | null>(null)
  const catalog = useSignal<CatalogFile | null>(null)
  const layerFilter = useSignal<string>('all')
  const query = useSignal<string>('')

  useSignalEffect(() => {
    fetch('/tokens.catalog.json')
      .then((r) => {
        if (!r.ok) throw new Error(`tokens.catalog.json: ${r.status}`)
        return r.json() as Promise<CatalogFile>
      })
      .then((c) => {
        catalog.value = c
        loading.value = false
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : 'Failed to load tokens'
        loading.value = false
      })
  })

  if (loading.value) return <article class="doc-page">Loading tokens…</article>
  if (error.value || !catalog.value)
    return <article class="doc-page">Failed to load tokens: {error.value}</article>

  const all = catalog.value.tokens
  const q = query.value.trim().toLowerCase()
  const tokens = all.filter(
    (t) =>
      (layerFilter.value === 'all' || t.layer === layerFilter.value) &&
      (q === '' || t.name.toLowerCase().includes(q)),
  )
  const layers = ['all', 'primitive', 'semantic', 'component']

  return (
    <article class="doc-page">
      <div class="doc-head">
        <div class="doc-eyebrow">Design Tokens</div>
        <h1>Design Tokens</h1>
        <p class="doc-lede">
          The complete, closed set of <code>--cascivo-*</code> custom properties — auto-generated
          from the token sources. Previews are live: switch the theme to see every value resolve.{' '}
          {catalog.value.count} tokens.
        </p>
      </div>

      <section class="doc-section">
        <div
          style={{
            display: 'flex',
            gap: 'var(--cascivo-space-4)',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label
              htmlFor="tok-layer"
              style={{
                display: 'block',
                fontSize: 'var(--cascivo-text-sm)',
                marginBlockEnd: '0.25rem',
              }}
            >
              Layer
            </label>
            <select
              id="tok-layer"
              value={layerFilter.value}
              onChange={(e) => (layerFilter.value = (e.target as HTMLSelectElement).value)}
            >
              {layers.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 16rem' }}>
            <label
              htmlFor="tok-search"
              style={{
                display: 'block',
                fontSize: 'var(--cascivo-text-sm)',
                marginBlockEnd: '0.25rem',
              }}
            >
              Filter by name
            </label>
            <input
              id="tok-search"
              type="search"
              placeholder="accent, radius, space…"
              value={query.value}
              onInput={(e) => (query.value = (e.target as HTMLInputElement).value)}
              style={{ inlineSize: '100%' }}
            />
          </div>
        </div>
      </section>

      {[...SECTIONS, { id: 'other', label: 'Other', kind: 'value' as Kind, groups: [] }].map(
        (section) => {
          const items = tokens.filter((t) => sectionFor(t).id === section.id)
          if (items.length === 0) return null
          return (
            <section class="doc-section" key={section.id}>
              <h2>
                {section.label}{' '}
                <span style={{ color: 'var(--cascivo-color-text-muted)', fontWeight: 400 }}>
                  ({items.length})
                </span>
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
                  gap: 'var(--cascivo-space-3)',
                }}
              >
                {items.map((t) => (
                  <div
                    key={t.name}
                    style={{
                      display: 'flex',
                      gap: 'var(--cascivo-space-3)',
                      alignItems: 'center',
                      padding: 'var(--cascivo-space-3)',
                      border:
                        '1px solid var(--cascivo-color-border-subtle, var(--cascivo-color-border))',
                      borderRadius: 'var(--cascivo-radius-md, 0.5rem)',
                    }}
                  >
                    <Preview token={t} kind={section.kind} />
                    <div style={{ minWidth: 0 }}>
                      <code
                        style={{
                          display: 'block',
                          fontSize: 'var(--cascivo-text-sm)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {t.name}
                      </code>
                      <code
                        style={{
                          display: 'block',
                          color: 'var(--cascivo-color-text-muted)',
                          fontSize: 'var(--cascivo-text-xs)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {t.resolvedDefault ?? t.value}
                      </code>
                      <span
                        style={{
                          fontSize: 'var(--cascivo-text-xs)',
                          color: 'var(--cascivo-color-text-muted)',
                        }}
                      >
                        {t.layer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        },
      )}
    </article>
  )
}
