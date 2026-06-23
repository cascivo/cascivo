// Icons gallery — auto-generated from /icons.catalog.json (built by
// `pnpm icons:generate`). Renders every @cascivo/icons export as a searchable,
// click-to-copy grid. Nothing here is hand-listed: add an SVG to
// packages/icons/svg, run regen, and it shows up. Signal-driven (no
// useState/useEffect), per CLAUDE.md (the docs app is Preact).
import { useClipboard, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { useLocation } from 'preact-iso'
import type { JSX } from 'preact'
import * as Icons from '@cascivo/icons'
import { Button } from '@cascivo/components/button'
import styles from './IconsPage.module.css'

interface IconEntry {
  name: string
  pascalName: string
  category: string
  tags: string[]
  keywords: string[]
  svg: string
}

interface CatalogFile {
  count: number
  icons: IconEntry[]
}

type IconComponent = (props: { size?: number; color?: string }) => JSX.Element
const registry = Icons as unknown as Record<string, IconComponent>

const SIZES = [16, 24, 32, 48]
const COLORS: { label: string; value: string }[] = [
  { label: 'Default', value: 'currentColor' },
  { label: 'Accent', value: 'var(--cascivo-color-accent)' },
  { label: 'Success', value: 'var(--cascivo-color-success, var(--cascivo-color-accent))' },
  { label: 'Danger', value: 'var(--cascivo-color-danger, var(--cascivo-color-accent))' },
  { label: 'Muted', value: 'var(--cascivo-color-text-muted)' },
]
const THEMES = ['auto', 'light', 'dark', 'warm']

export function IconsPage() {
  useSignals()
  const { query: urlQuery } = useLocation()
  const { copy } = useClipboard()

  const loading = useSignal(true)
  const error = useSignal<string | null>(null)
  const catalog = useSignal<CatalogFile | null>(null)
  const query = useSignal((urlQuery as Record<string, string>)?.q ?? '')
  const size = useSignal(24)
  const color = useSignal('currentColor')
  const category = useSignal('all')
  const theme = useSignal('auto')
  const copied = useSignal<string | null>(null)

  useSignalEffect(() => {
    fetch('/icons.catalog.json')
      .then((r) => {
        if (!r.ok) throw new Error(`icons.catalog.json: ${r.status}`)
        return r.json() as Promise<CatalogFile>
      })
      .then((c) => {
        catalog.value = c
        loading.value = false
      })
      .catch((e: unknown) => {
        error.value = e instanceof Error ? e.message : 'Failed to load icons'
        loading.value = false
      })
  })

  if (loading.value) return <article class="doc-page">Loading icons…</article>
  if (error.value || !catalog.value)
    return <article class="doc-page">Failed to load icons: {error.value}</article>

  const all = catalog.value.icons
  const categories = ['all', ...new Set(all.map((i) => i.category))]
  const q = query.value.trim().toLowerCase()
  const visible = all.filter((icon) => {
    if (category.value !== 'all' && icon.category !== category.value) return false
    if (q === '') return true
    return (
      icon.name.includes(q) ||
      icon.pascalName.toLowerCase().includes(q) ||
      icon.keywords.some((k) => k.includes(q))
    )
  })

  const onCopy = (pascalName: string) => {
    void copy(`import { ${pascalName} } from '@cascivo/icons'`)
    copied.value = pascalName
    setTimeout(() => {
      if (copied.value === pascalName) copied.value = null
    }, 1500)
  }

  return (
    <article class="doc-page">
      <div class="doc-head">
        <div class="doc-eyebrow">Icons</div>
        <h1>Icons</h1>
        <p class="doc-lede">
          {catalog.value.count} stroked 24×24 <code>currentColor</code> SVG icons — tree-shakeable
          named exports from <code>@cascivo/icons</code>. Click any icon to copy its import.
        </p>
      </div>

      <section class="doc-section">
        <div class={styles['controls']}>
          <div style={{ flex: '1 1 16rem' }}>
            <label htmlFor="icon-search" class={styles['control-label']}>
              Search
            </label>
            <input
              id="icon-search"
              type="search"
              placeholder="search, arrow, heart, health…"
              value={query.value}
              onInput={(e) => (query.value = (e.target as HTMLInputElement).value)}
              style={{ inlineSize: '100%' }}
            />
          </div>
          <div>
            <label htmlFor="icon-cat" class={styles['control-label']}>
              Category
            </label>
            <select
              id="icon-cat"
              value={category.value}
              onChange={(e) => (category.value = (e.target as HTMLSelectElement).value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="icon-color" class={styles['control-label']}>
              Color
            </label>
            <select
              id="icon-color"
              value={color.value}
              onChange={(e) => (color.value = (e.target as HTMLSelectElement).value)}
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="icon-theme" class={styles['control-label']}>
              Theme
            </label>
            <select
              id="icon-theme"
              value={theme.value}
              onChange={(e) => (theme.value = (e.target as HTMLSelectElement).value)}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span class={styles['control-label']}>Size</span>
            <div class={styles['sizes']}>
              {SIZES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={size.value === s ? 'primary' : 'ghost'}
                  onClick={() => (size.value = s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="doc-section">
        <h2>
          {visible.length}{' '}
          <span style={{ color: 'var(--cascivo-color-text-muted)', fontWeight: 400 }}>
            {visible.length === 1 ? 'icon' : 'icons'}
          </span>
        </h2>
        {visible.length === 0 ? (
          <p class={styles['empty']}>No icons match “{query.value}”.</p>
        ) : (
          <div class={styles['grid']} data-theme={theme.value === 'auto' ? undefined : theme.value}>
            {visible.map((icon) => {
              const Glyph = registry[icon.pascalName]
              return (
                <button
                  key={icon.pascalName}
                  type="button"
                  class={styles['tile']}
                  onClick={() => onCopy(icon.pascalName)}
                  aria-label={`Copy import for ${icon.pascalName}`}
                >
                  <span class={styles['glyph']}>
                    {Glyph ? <Glyph size={size.value} color={color.value} /> : null}
                  </span>
                  <span
                    class={copied.value === icon.pascalName ? styles['copied'] : styles['name']}
                  >
                    {copied.value === icon.pascalName ? 'Copied!' : icon.pascalName}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </article>
  )
}
