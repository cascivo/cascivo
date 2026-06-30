import { signal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Badge } from '@cascivo/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@cascivo/components/card'
import { Input } from '@cascivo/components/input'

interface TemplateScreenshot {
  light: string
  dark?: string
  alt: string
}

interface MarketplaceTemplate {
  name: string
  namespace: string
  description: string
  category: string
  framework: string
  tags: string[]
  components: string[]
  screenshots: TemplateScreenshot[]
  demoUrl?: string
  version: string
  license: string
  verified: boolean
  homepage?: string
  installSpec: string
  stars?: number
}

interface MarketplaceCatalog {
  generatedAt: string
  templates: MarketplaceTemplate[]
  facets: { categories: string[]; frameworks: string[]; tags: string[] }
}

const templates = signal<MarketplaceTemplate[]>([])
const categories = signal<string[]>([])
const filter = signal('')
const activeCategory = signal<string | null>(null)
const verifiedOnly = signal(false)
const loading = signal(true)
const error = signal<string | null>(null)

export function MarketplacePage() {
  useSignals()

  useSignalEffect(() => {
    fetch('/marketplace.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<MarketplaceCatalog>
      })
      .then((data) => {
        templates.value = data.templates
        categories.value = data.facets.categories
        loading.value = false
      })
      .catch((err: unknown) => {
        error.value = err instanceof Error ? err.message : 'Failed to load the catalog'
        loading.value = false
      })
  })

  const query = filter.value.toLowerCase()
  const cat = activeCategory.value
  const filtered = templates.value.filter((t) => {
    if (cat && t.category !== cat) return false
    if (verifiedOnly.value && !t.verified) return false
    if (!query) return true
    return (
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Marketplace</div>
        <h1>Templates</h1>
        <p class="doc-lede">
          Whole-page compositions you own and adapt — install a template's components and page with{' '}
          <code>npx cascivo add @ns/&lt;template&gt;</code>. Community-contributed, hosted on
          GitHub, no backend.
        </p>
      </header>

      <section class="doc-section">
        <div style={{ marginBlockEnd: 'var(--cascivo-space-4)', maxInlineSize: '28rem' }}>
          <Input
            label="Filter templates"
            type="search"
            placeholder="Search by name, description, or tag…"
            value={filter.value}
            onInput={(e: { currentTarget: HTMLInputElement }) => {
              filter.value = e.currentTarget.value
            }}
          />
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--cascivo-space-2)',
            alignItems: 'center',
            marginBlockEnd: 'var(--cascivo-space-5)',
          }}
        >
          <FilterChip
            label="All"
            active={cat === null}
            onClick={() => {
              activeCategory.value = null
            }}
          />
          {categories.value.map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={cat === c}
              onClick={() => {
                activeCategory.value = c
              }}
            />
          ))}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--cascivo-space-1)',
              marginInlineStart: 'auto',
              fontSize: 'var(--cascivo-text-sm)',
              color: 'var(--cascivo-color-text-subtle)',
              minBlockSize: 'var(--cascivo-target-min-coarse, 2.75rem)',
            }}
          >
            <input
              type="checkbox"
              checked={verifiedOnly.value}
              onChange={(e: { currentTarget: HTMLInputElement }) => {
                verifiedOnly.value = e.currentTarget.checked
              }}
            />
            Verified only
          </label>
        </div>

        {loading.value && (
          <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>Loading templates…</p>
        )}

        {error.value && (
          <p style={{ color: 'var(--cascivo-color-destructive)' }}>Error: {error.value}</p>
        )}

        {!loading.value && !error.value && filtered.length === 0 && (
          <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>
            {templates.value.length === 0
              ? 'No templates published yet — be the first to contribute one.'
              : 'No templates match your filter.'}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
            gap: 'var(--cascivo-space-4)',
          }}
        >
          {filtered.map((t) => (
            <TemplateCard key={t.installSpec} template={t} />
          ))}
        </div>
      </section>
    </article>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: 'var(--cascivo-space-1) var(--cascivo-space-3)',
        fontSize: 'var(--cascivo-text-sm)',
        border: '1px solid var(--cascivo-color-border)',
        borderRadius: 'var(--cascivo-radius-full, 999px)',
        background: active ? 'var(--cascivo-color-accent)' : 'var(--cascivo-color-surface)',
        color: active
          ? 'var(--cascivo-color-accent-foreground, #fff)'
          : 'var(--cascivo-color-text)',
        cursor: 'pointer',
        textTransform: 'capitalize',
      }}
    >
      {label}
    </button>
  )
}

function TemplateCard({ template: t }: { template: MarketplaceTemplate }) {
  const snippet = `npx cascivo add ${t.installSpec}`
  const shot = t.screenshots[0]

  return (
    <Card>
      {shot && (
        <img
          src={shot.light}
          alt={shot.alt}
          loading="lazy"
          style={{
            // Pull the banner out to the card's edges (the Card's default `md`
            // padding would otherwise inset it); the card's overflow:hidden
            // clips it to the rounded top corners.
            marginBlockStart: 'calc(-1 * var(--cascivo-space-6))',
            marginInline: 'calc(-1 * var(--cascivo-space-6))',
            marginBlockEnd: 'var(--cascivo-space-2)',
            inlineSize: 'calc(100% + 2 * var(--cascivo-space-6))',
            blockSize: 'auto',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            background: 'var(--cascivo-color-surface-raised)',
            borderBlockEnd: '1px solid var(--cascivo-color-border)',
          }}
        />
      )}
      <CardHeader>
        <CardTitle>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cascivo-space-2)' }}>
            {t.name}
            {t.verified ? (
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                Unverified
              </Badge>
            )}
          </span>
        </CardTitle>
        <p
          style={{
            fontSize: 'var(--cascivo-text-xs)',
            color: 'var(--cascivo-color-text-subtle)',
            margin: 0,
          }}
        >
          {t.namespace} · {t.framework}
          {typeof t.stars === 'number' ? ` · ★ ${t.stars}` : ''}
        </p>
      </CardHeader>

      <CardContent>
        <p
          style={{
            fontSize: 'var(--cascivo-text-sm)',
            color: 'var(--cascivo-color-text)',
            marginBlockEnd: 'var(--cascivo-space-3)',
          }}
        >
          {t.description}
        </p>

        {t.components.length > 0 && (
          <p
            style={{
              fontSize: 'var(--cascivo-text-xs)',
              color: 'var(--cascivo-color-text-subtle)',
              marginBlockEnd: 'var(--cascivo-space-3)',
            }}
          >
            Includes: {t.components.join(', ')}
          </p>
        )}

        <CopySnippet snippet={snippet} />

        {t.demoUrl && (
          <a
            href={t.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginBlockStart: 'var(--cascivo-space-3)',
              fontSize: 'var(--cascivo-text-sm)',
              color: 'var(--cascivo-color-accent)',
            }}
          >
            Live demo →
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function CopySnippet({ snippet }: { snippet: string }) {
  const copied = useSignal(false)

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cascivo-space-2)',
        background: 'var(--cascivo-color-surface-raised)',
        border: '1px solid var(--cascivo-color-border)',
        borderRadius: 'var(--cascivo-radius-md)',
        padding: 'var(--cascivo-space-2) var(--cascivo-space-3)',
      }}
    >
      <code
        style={{
          flex: 1,
          fontSize: 'var(--cascivo-text-xs)',
          color: 'var(--cascivo-color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {snippet}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-live="polite"
        style={{
          flexShrink: 0,
          minBlockSize: 'var(--cascivo-target-min-coarse, 2.75rem)',
          padding: 'var(--cascivo-space-1) var(--cascivo-space-2)',
          fontSize: 'var(--cascivo-text-xs)',
          border: '1px solid var(--cascivo-color-border)',
          borderRadius: 'var(--cascivo-radius-sm)',
          background: 'var(--cascivo-color-surface)',
          color: 'var(--cascivo-color-text-subtle)',
          cursor: 'pointer',
        }}
      >
        {copied.value ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
