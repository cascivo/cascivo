import type { ComponentChildren } from 'preact'
import { useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'

// ---------------------------------------------------------------------------
// Artifact shapes (subset of the generated JSON we render).
// ---------------------------------------------------------------------------

interface AntiPattern {
  bad: string
  good: string
  why: string
}

interface RelatedEdge {
  name: string
  relationship: string
  reason: string
}

interface FlexibilityEntry {
  area: string
  level: 'strict' | 'flexible'
  note: string
}

interface Intent {
  whenToUse?: string[]
  whenNotToUse?: string[]
  antiPatterns?: AntiPattern[]
  related?: RelatedEdge[]
  a11yRationale?: string
  flexibility?: FlexibilityEntry[]
  content?: { tone?: string; notes?: string }
}

interface ContextComponent {
  name: string
  category: string
  description: string
  intent?: Intent
}

interface ContextFile {
  components: ContextComponent[]
}

interface BoundaryEntry {
  area: string
  note: string
}

interface BoundariesFile {
  global: { strict: BoundaryEntry[]; flexible: BoundaryEntry[] }
  perComponent: Record<string, FlexibilityEntry[]>
}

interface SpecEntry {
  id: string
  title: string
  summary?: string
}

interface SpecsFile {
  specs: SpecEntry[]
}

interface CatalogToken {
  name: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault: string | null
}

interface CatalogFile {
  count: number
  tokens: CatalogToken[]
}

// ---------------------------------------------------------------------------
// Shared cell styles (kept inline to match the docs' token-driven convention).
// ---------------------------------------------------------------------------

const muted = { color: 'var(--cascade-color-text-subtle)' }
const sectionGap = { marginBlockEnd: 'var(--cascade-space-8)' }

const labelStyle = {
  display: 'block',
  fontSize: 'var(--cascade-text-sm)',
  fontWeight: 'var(--cascade-font-medium)',
  color: 'var(--cascade-color-text-subtle)',
  marginBlockEnd: 'var(--cascade-space-2)',
}

const controlStyle = {
  padding: 'var(--cascade-space-2) var(--cascade-space-3)',
  border: '1px solid var(--cascade-color-border)',
  borderRadius: 'var(--cascade-radius-md)',
  background: 'var(--cascade-color-surface)',
  color: 'var(--cascade-color-text)',
  fontSize: 'var(--cascade-text-sm)',
}

const cardStyle = {
  border: '1px solid var(--cascade-color-border)',
  borderRadius: 'var(--cascade-radius-lg)',
  background: 'var(--cascade-color-surface)',
  padding: 'var(--cascade-space-4)',
}

export function ContextExplorerPage() {
  useSignals()

  const loading = useSignal(true)
  const error = useSignal<string | null>(null)
  const context = useSignal<ContextFile | null>(null)
  const boundaries = useSignal<BoundariesFile | null>(null)
  const specs = useSignal<SpecsFile | null>(null)
  const catalog = useSignal<CatalogFile | null>(null)
  const sizes = useSignal<{ context: number; catalog: number } | null>(null)

  // Intent browser selection.
  const selected = useSignal<string>('')
  // Token catalog filters.
  const layerFilter = useSignal<string>('all')
  const groupFilter = useSignal<string>('all')

  // --- Fetch all four artifacts. ---
  useSignalEffect(() => {
    Promise.all([
      fetch('/context.json').then((r) => bodyOrThrow<ContextFile>(r, 'context.json')),
      fetch('/boundaries.json').then((r) => bodyOrThrow<BoundariesFile>(r, 'boundaries.json')),
      fetch('/specs.json').then((r) => bodyOrThrow<SpecsFile>(r, 'specs.json')),
      fetch('/tokens.catalog.json').then((r) => bodyOrThrow<CatalogFile>(r, 'tokens.catalog.json')),
      sizeOf('/context.json'),
      sizeOf('/tokens.catalog.json'),
    ])
      .then(([ctx, bnd, spc, cat, ctxSize, catSize]) => {
        context.value = ctx
        boundaries.value = bnd
        specs.value = spc
        catalog.value = cat
        sizes.value = { context: ctxSize, catalog: catSize }
        selected.value = ctx.components[0]?.name ?? ''
        loading.value = false
      })
      .catch((err: unknown) => {
        error.value = err instanceof Error ? err.message : 'Failed to load context'
        loading.value = false
      })
  })

  if (loading.value) {
    return (
      <article class="doc-page">
        <p style={muted}>Loading context…</p>
      </article>
    )
  }

  if (error.value) {
    return (
      <article class="doc-page">
        <p style={{ color: 'var(--cascade-color-destructive)' }}>Error: {error.value}</p>
      </article>
    )
  }

  const ctx = context.value
  const cat = catalog.value
  const components = ctx?.components ?? []
  const current = components.find((c) => c.name === selected.value)
  const intent = current?.intent
  const knownNames = new Set(components.map((c) => c.name))

  // Token catalog filtering.
  const tokens = cat?.tokens ?? []
  const layers = ['all', ...new Set(tokens.map((t) => t.layer))]
  const groups = ['all', ...new Set(tokens.map((t) => t.group))]
  const filteredTokens = tokens.filter(
    (t) =>
      (layerFilter.value === 'all' || t.layer === layerFilter.value) &&
      (groupFilter.value === 'all' || t.group === groupFilter.value),
  )

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">For AI agents</div>
        <h1>Context Explorer</h1>
        <p class="doc-lede">
          Browse the machine-readable context cascade ships to agents — component intent, design
          boundaries, specs, and the full token catalog.
        </p>
      </header>

      {/* ---------------- Intent browser ---------------- */}
      <section class="doc-section" style={sectionGap}>
        <h2>Intent browser</h2>
        <div style={{ marginBlockEnd: 'var(--cascade-space-4)' }}>
          <label htmlFor="ctx-component" style={labelStyle}>
            Component
          </label>
          <select
            id="ctx-component"
            value={selected.value}
            onChange={(e) => {
              selected.value = (e.target as HTMLSelectElement).value
            }}
            style={{ ...controlStyle, minWidth: '16rem' }}
          >
            {components.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {current && (
          <div style={{ display: 'grid', gap: 'var(--cascade-space-4)' }}>
            <p style={muted}>{current.description}</p>

            {intent?.whenToUse?.length ? (
              <IntentList title="When to use" items={intent.whenToUse} />
            ) : null}

            {intent?.whenNotToUse?.length ? (
              <IntentList title="When not to use" items={intent.whenNotToUse} />
            ) : null}

            {intent?.antiPatterns?.length ? (
              <div>
                <h3>Anti-patterns</h3>
                <div style={{ display: 'grid', gap: 'var(--cascade-space-3)' }}>
                  {intent.antiPatterns.map((ap, i) => (
                    <div key={i} style={cardStyle}>
                      <p style={{ margin: 0, color: 'var(--cascade-color-destructive)' }}>
                        <strong>Bad:</strong> <code>{ap.bad}</code>
                      </p>
                      <p
                        style={{
                          margin: 'var(--cascade-space-2) 0 0',
                          color: 'var(--cascade-color-success)',
                        }}
                      >
                        <strong>Good:</strong> <code>{ap.good}</code>
                      </p>
                      <p style={{ margin: 'var(--cascade-space-2) 0 0', ...muted }}>{ap.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {intent?.related?.length ? (
              <div>
                <h3>Related</h3>
                <ul>
                  {intent.related.map((rel) => (
                    <li key={rel.name}>
                      {knownNames.has(rel.name) ? (
                        <button
                          type="button"
                          onClick={() => {
                            selected.value = rel.name
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--cascade-color-accent)',
                            cursor: 'pointer',
                            font: 'inherit',
                          }}
                        >
                          {rel.name}
                        </button>
                      ) : (
                        <strong>{rel.name}</strong>
                      )}{' '}
                      <span style={muted}>
                        ({rel.relationship}) — {rel.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {intent?.a11yRationale ? (
              <div>
                <h3>Accessibility rationale</h3>
                <p style={muted}>{intent.a11yRationale}</p>
              </div>
            ) : null}

            {intent?.content ? (
              <div>
                <h3>Content tone</h3>
                {intent.content.tone && <p style={{ margin: 0 }}>{intent.content.tone}</p>}
                {intent.content.notes && (
                  <p style={{ margin: 'var(--cascade-space-2) 0 0', ...muted }}>
                    {intent.content.notes}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* ---------------- Boundaries map ---------------- */}
      <section class="doc-section" style={sectionGap}>
        <h2>Boundaries map</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: 'var(--cascade-space-4)',
          }}
        >
          <BoundaryColumn
            title="Global — strict"
            tone="var(--cascade-color-destructive)"
            entries={boundaries.value?.global.strict ?? []}
          />
          <BoundaryColumn
            title="Global — flexible"
            tone="var(--cascade-color-success)"
            entries={boundaries.value?.global.flexible ?? []}
          />
        </div>

        {current && boundaries.value?.perComponent[current.name]?.length ? (
          <div style={{ marginBlockStart: 'var(--cascade-space-5)' }}>
            <h3>{current.name} — flexibility</h3>
            <ul>
              {boundaries.value.perComponent[current.name]?.map((f, i) => (
                <li key={i}>
                  <strong>{f.area}</strong>{' '}
                  <span
                    style={{
                      color:
                        f.level === 'strict'
                          ? 'var(--cascade-color-destructive)'
                          : 'var(--cascade-color-success)',
                    }}
                  >
                    [{f.level}]
                  </span>{' '}
                  <span style={muted}>— {f.note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ---------------- Specs ---------------- */}
      <section class="doc-section" style={sectionGap}>
        <h2>Design specs</h2>
        <ul>
          {(specs.value?.specs ?? []).map((s) => (
            <li key={s.id}>
              <strong>{s.title}</strong> <span style={muted}>({s.id})</span>
              {s.summary && (
                <div style={{ ...muted, fontSize: 'var(--cascade-text-sm)' }}>{s.summary}</div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------- Token catalog ---------------- */}
      <section class="doc-section" style={sectionGap}>
        <h2>Token catalog</h2>
        <div
          style={{
            display: 'flex',
            gap: 'var(--cascade-space-4)',
            marginBlockEnd: 'var(--cascade-space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <label htmlFor="tok-layer" style={labelStyle}>
              Layer
            </label>
            <select
              id="tok-layer"
              value={layerFilter.value}
              onChange={(e) => {
                layerFilter.value = (e.target as HTMLSelectElement).value
              }}
              style={controlStyle}
            >
              {layers.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tok-group" style={labelStyle}>
              Group
            </label>
            <select
              id="tok-group"
              value={groupFilter.value}
              onChange={(e) => {
                groupFilter.value = (e.target as HTMLSelectElement).value
              }}
              style={controlStyle}
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p style={{ ...muted, fontSize: 'var(--cascade-text-sm)' }}>
          {filteredTokens.length} of {tokens.length} tokens
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--cascade-text-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  borderBlockEnd: '1px solid var(--cascade-color-border)',
                }}
              >
                <Th>Name</Th>
                <Th>Layer</Th>
                <Th>Group</Th>
                <Th>Resolved default</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((t) => (
                <tr
                  key={t.name}
                  style={{ borderBlockEnd: '1px solid var(--cascade-color-border-subtle)' }}
                >
                  <Td>
                    <code>{t.name}</code>
                  </Td>
                  <Td>{t.layer}</Td>
                  <Td>{t.group}</Td>
                  <Td>
                    <code style={muted}>{t.resolvedDefault ?? '—'}</code>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- Bundle size note ---------------- */}
      <section class="doc-section" style={sectionGap}>
        <p style={{ ...muted, fontSize: 'var(--cascade-text-sm)' }}>
          Context bundle size: ~{sizes.value?.context ?? '?'}KB (context.json) +{' '}
          {sizes.value?.catalog ?? '?'}KB (tokens.catalog.json) — fetched on demand, not bundled.
        </p>
      </section>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Small presentational helpers.
// ---------------------------------------------------------------------------

function IntentList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function BoundaryColumn({
  title,
  tone,
  entries,
}: {
  title: string
  tone: string
  entries: BoundaryEntry[]
}) {
  return (
    <div style={cardStyle}>
      <h3 style={{ marginBlockStart: 0, color: tone }}>{title}</h3>
      <ul style={{ marginBlockEnd: 0 }}>
        {entries.map((e, i) => (
          <li key={i}>
            <strong>{e.area}</strong> <span style={muted}>— {e.note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Th({ children }: { children: ComponentChildren }) {
  return (
    <th style={{ padding: 'var(--cascade-space-2)', fontWeight: 'var(--cascade-font-medium)' }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: ComponentChildren }) {
  return <td style={{ padding: 'var(--cascade-space-2)', verticalAlign: 'top' }}>{children}</td>
}

// ---------------------------------------------------------------------------
// Fetch utilities.
// ---------------------------------------------------------------------------

async function bodyOrThrow<T>(res: Response, name: string): Promise<T> {
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
  return (await res.json()) as T
}

/** Rounded KB size of a public asset via a HEAD request (content-length). */
async function sizeOf(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    const len = res.headers.get('content-length')
    if (len) return Math.round(Number(len) / 1024)
  } catch {
    // fall through
  }
  return 0
}
