import { useSignal, useSignals } from '@cascivo/core'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  components,
  type Category,
  type RegistryEntry,
} from '../data'
import { PropsTable } from './components/PropsTable'

/** Entries routed under /docs/components/* — every documented category. */
const CORE = new Set<string>(CATEGORY_ORDER)

function matches(entry: RegistryEntry, q: string): boolean {
  if (!q) return true
  if (entry.meta.name.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q)) return true
  if (entry.meta.props.some((p) => p.name.toLowerCase().includes(q))) return true
  if (entry.meta.variants.some((v) => v.toLowerCase().includes(q))) return true
  if (entry.meta.sizes.some((s) => s.toLowerCase().includes(q))) return true
  return false
}

function Chips({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null
  return (
    <p class="api-chips">
      <span class="muted">{label}:</span>{' '}
      {values.map((v) => (
        <code key={v} class="chip">
          {v}
        </code>
      ))}
    </p>
  )
}

export function ApiReferencePage() {
  useSignals()
  const query = useSignal('')
  const q = query.value.trim().toLowerCase()

  const entries = components
    .filter((e) => CORE.has(e.category) && e.meta.props.length > 0)
    .filter((e) => matches(e, q))

  const propCount = entries.reduce((n, e) => n + e.meta.props.length, 0)

  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: entries
      .filter((e) => e.category === cat)
      .sort((a, b) => a.meta.name.localeCompare(b.meta.name)),
  })).filter((g) => g.items.length > 0)

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Reference</div>
        <h1>API reference</h1>
        <p class="doc-lede">
          Every component prop, variant, and size in one searchable place. Filter by component or
          prop name (e.g. <code>loading</code>, <code>size</code>, <code>asChild</code>).
        </p>
      </header>

      <div class="api-filter">
        <label for="api-filter-input">Filter</label>
        <input
          id="api-filter-input"
          type="search"
          placeholder="Component or prop name…"
          value={query.value}
          onInput={(e) => {
            query.value = (e.target as HTMLInputElement).value
          }}
        />
        <span class="muted">
          {entries.length} components · {propCount} props
        </span>
      </div>

      {groups.length === 0 ? (
        <p class="muted">No components match “{query.value}”.</p>
      ) : (
        groups.map((group) => (
          <section class="doc-section" key={group.cat}>
            <h2>{CATEGORY_LABELS[group.cat as Category]}</h2>
            {group.items.map((entry) => (
              <section class="api-entry" id={`api-${entry.name}`} key={entry.name}>
                <h3>
                  <a href={`/docs/components/${entry.name}`}>{entry.meta.name}</a>
                </h3>
                <p class="muted">{entry.meta.description}</p>
                <Chips label="Variants" values={entry.meta.variants} />
                <Chips label="Sizes" values={entry.meta.sizes} />
                <PropsTable props={entry.meta.props} />
              </section>
            ))}
          </section>
        ))
      )}
    </article>
  )
}
