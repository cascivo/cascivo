import { useSignal, useSignalEffect, useSignals } from '@cascade-ui/core'
import { Badge } from '@cascade-ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@cascade-ui/components/card'

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

const registries = useSignal<RegistryEntry[]>([])
const filter = useSignal('')
const loading = useSignal(true)
const error = useSignal<string | null>(null)

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
          Third-party and first-party component registries compatible with the cascade CLI. Install
          components from any registry with <code>npx cascade add @ns/&lt;component&gt;</code>.
        </p>
      </header>

      <section class="doc-section">
        <div style={{ marginBlockEnd: 'var(--cascade-space-5)' }}>
          <label
            htmlFor="dir-search"
            style={{
              display: 'block',
              fontSize: 'var(--cascade-text-sm)',
              fontWeight: 'var(--cascade-font-medium)',
              color: 'var(--cascade-color-text-subtle)',
              marginBlockEnd: 'var(--cascade-space-2)',
            }}
          >
            Filter registries
          </label>
          <input
            id="dir-search"
            type="search"
            placeholder="Search by name, description, or tag…"
            value={filter.value}
            onInput={(e) => {
              filter.value = (e.target as HTMLInputElement).value
            }}
            style={{
              width: '100%',
              maxWidth: '28rem',
              padding: 'var(--cascade-space-2) var(--cascade-space-3)',
              border: '1px solid var(--cascade-color-border)',
              borderRadius: 'var(--cascade-radius-md)',
              background: 'var(--cascade-color-surface)',
              color: 'var(--cascade-color-text)',
              fontSize: 'var(--cascade-text-sm)',
            }}
          />
        </div>

        {loading.value && (
          <p style={{ color: 'var(--cascade-color-text-subtle)' }}>Loading registries…</p>
        )}

        {error.value && (
          <p style={{ color: 'var(--cascade-color-destructive)' }}>Error: {error.value}</p>
        )}

        {!loading.value && !error.value && filtered.length === 0 && (
          <p style={{ color: 'var(--cascade-color-text-subtle)' }}>
            No registries match your filter.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
            gap: 'var(--cascade-space-4)',
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
  const snippet = `npx cascade add ${entry.namespace}/<component>`

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cascade-space-2)' }}>
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
            fontSize: 'var(--cascade-text-xs)',
            color: 'var(--cascade-color-text-subtle)',
            margin: 0,
          }}
        >
          {entry.namespace}
        </p>
      </CardHeader>

      <CardContent>
        <p
          style={{
            fontSize: 'var(--cascade-text-sm)',
            color: 'var(--cascade-color-text)',
            marginBlockEnd: 'var(--cascade-space-3)',
          }}
        >
          {entry.description}
        </p>

        {(entry.tags ?? []).length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--cascade-space-1)',
              marginBlockEnd: 'var(--cascade-space-3)',
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
              marginBlockStart: 'var(--cascade-space-3)',
              fontSize: 'var(--cascade-text-sm)',
              color: 'var(--cascade-color-accent)',
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
        gap: 'var(--cascade-space-2)',
        background: 'var(--cascade-color-surface-raised)',
        border: '1px solid var(--cascade-color-border)',
        borderRadius: 'var(--cascade-radius-md)',
        padding: 'var(--cascade-space-2) var(--cascade-space-3)',
      }}
    >
      <code
        style={{
          flex: 1,
          fontSize: 'var(--cascade-text-xs)',
          color: 'var(--cascade-color-text)',
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
          padding: 'var(--cascade-space-1) var(--cascade-space-2)',
          fontSize: 'var(--cascade-text-xs)',
          border: '1px solid var(--cascade-color-border)',
          borderRadius: 'var(--cascade-radius-sm)',
          background: 'var(--cascade-color-surface)',
          color: 'var(--cascade-color-text-subtle)',
          cursor: 'pointer',
        }}
      >
        {copied.value ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
