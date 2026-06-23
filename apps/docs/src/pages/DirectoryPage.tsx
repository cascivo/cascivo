import { signal, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { Badge } from '@cascivo/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@cascivo/components/card'
import { Input } from '@cascivo/components/input'

interface RegistryEntry {
  namespace: string
  name: string
  description: string
  homepage?: string
  registryUrl?: string
  tags?: string[]
  verified?: boolean
}

interface RegistriesJson {
  schemaVersion: number
  registries: RegistryEntry[]
}

const registries = signal<RegistryEntry[]>([])
const filter = signal('')
const loading = signal(true)
const error = signal<string | null>(null)

export function DirectoryPage() {
  useSignals()

  useSignalEffect(() => {
    fetch('/r/registries.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<RegistriesJson>
      })
      .then((data) => {
        registries.value = data.registries
        loading.value = false
      })
      .catch((err: unknown) => {
        error.value = err instanceof Error ? err.message : 'Failed to load registries'
        loading.value = false
      })
  })

  const query = filter.value.toLowerCase()
  const filtered = registries.value.filter((r) => {
    if (!query) return true
    return (
      r.name.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      (r.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
    )
  })

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Registry</div>
        <h1>Directory</h1>
        <p class="doc-lede">
          Third-party and first-party component registries compatible with the cascivo CLI. Install
          components from any registry with <code>npx cascivo add @ns/&lt;component&gt;</code>.
        </p>
      </header>

      <section class="doc-section">
        <div style={{ marginBlockEnd: 'var(--cascivo-space-5)', maxInlineSize: '28rem' }}>
          <Input
            label="Filter registries"
            type="search"
            placeholder="Search by name, description, or tag…"
            value={filter.value}
            onInput={(e: { currentTarget: HTMLInputElement }) => {
              filter.value = e.currentTarget.value
            }}
          />
        </div>

        {loading.value && (
          <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>Loading registries…</p>
        )}

        {error.value && (
          <p style={{ color: 'var(--cascivo-color-destructive)' }}>Error: {error.value}</p>
        )}

        {!loading.value && !error.value && filtered.length === 0 && (
          <p style={{ color: 'var(--cascivo-color-text-subtle)' }}>
            No registries match your filter.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
            gap: 'var(--cascivo-space-4)',
          }}
        >
          {filtered.map((reg) => (
            <RegistryCard key={reg.namespace} entry={reg} />
          ))}
        </div>
      </section>
    </article>
  )
}

function RegistryCard({ entry }: { entry: RegistryEntry }) {
  const snippet = `npx cascivo add ${entry.namespace}/<component>`

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cascivo-space-2)' }}>
            {entry.name}
            {entry.verified && (
              <Badge variant="success" size="sm">
                Verified
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
          {entry.namespace}
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
          {entry.description}
        </p>

        {(entry.tags ?? []).length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--cascivo-space-1)',
              marginBlockEnd: 'var(--cascivo-space-3)',
            }}
          >
            {(entry.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <CopySnippet snippet={snippet} />

        {entry.homepage && (
          <a
            href={entry.homepage}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginBlockStart: 'var(--cascivo-space-3)',
              fontSize: 'var(--cascivo-text-sm)',
              color: 'var(--cascivo-color-accent)',
            }}
          >
            Visit homepage →
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
        style={{
          flexShrink: 0,
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
