import { useState } from 'preact/hooks'
import { components } from '../data'
import { layoutPreviews } from '../layout-previews'

type GroupKey = 'layout' | 'section' | 'block'

const GROUP_LABELS: Record<GroupKey, string> = {
  layout: 'Primitives',
  section: 'Sections',
  block: 'Blocks',
}

const GROUP_ORDER: GroupKey[] = ['layout', 'section', 'block']

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      style={{
        fontFamily: 'var(--cascivo-font-mono)',
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
        background: 'var(--cascivo-surface-subtle)',
        border: '1px solid var(--cascivo-color-border)',
        borderRadius: 'var(--cascivo-radius-sm)',
        cursor: 'pointer',
        color: 'var(--cascivo-text-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <code>{text}</code>
      <span style={{ color: 'var(--cascivo-text-secondary)' }}>{copied ? '✓' : '⎘'}</span>
    </button>
  )
}

export function LayoutsPage() {
  const entries = components.filter(
    (c) => c.type === 'layout' || c.type === 'section' || c.type === 'block',
  )

  const groups = new Map<GroupKey, typeof entries>()
  for (const key of GROUP_ORDER) groups.set(key, [])
  for (const entry of entries) {
    const key = (entry.type ?? 'layout') as GroupKey
    groups.get(key)?.push(entry)
  }

  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Layouts</div>
        <h1>Layout primitives, sections &amp; blocks</h1>
        <p class="doc-lede">
          Copy-paste layout primitives, page sections, and full-page blocks. Add any entry to your
          project with the cascade CLI or copy the source directly.
        </p>
      </header>

      {GROUP_ORDER.map((groupKey) => {
        const groupEntries = groups.get(groupKey) ?? []
        if (groupEntries.length === 0) return null
        return (
          <section key={groupKey} class="doc-section">
            <h2>{GROUP_LABELS[groupKey]}</h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--cascivo-space-8)',
              }}
            >
              {groupEntries.map((entry) => {
                const Preview = layoutPreviews[entry.name]
                const addName = entry.name.includes('/') ? entry.name.split('/').pop()! : entry.name
                const isMasonry =
                  entry.name === 'layout/masonry' || entry.name === 'section/media-masonry'
                return (
                  <div
                    key={entry.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--cascivo-space-3)',
                      paddingBlockStart: 'var(--cascivo-space-4)',
                      borderBlockStart: '1px solid var(--cascivo-color-border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 'var(--cascivo-space-4)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>
                        <code>{entry.name}</code>
                      </h3>
                      <CopyButton text={`npx cascade add ${addName}`} />
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: 'var(--cascivo-text-secondary)',
                      }}
                    >
                      {entry.description}
                    </p>
                    {isMasonry && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: 'var(--cascivo-text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        Fallback: CSS multi-columns, items flow top-to-bottom per column.
                      </p>
                    )}
                    {Preview ? (
                      <div
                        style={{
                          border: '1px solid var(--cascivo-color-border)',
                          borderRadius: 'var(--cascivo-radius-md)',
                          overflow: 'hidden',
                          containerType: 'inline-size',
                        }}
                      >
                        <Preview />
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: 'var(--cascivo-space-4)',
                          background: 'var(--cascivo-surface-subtle)',
                          border: '1px solid var(--cascivo-color-border)',
                          borderRadius: 'var(--cascivo-radius-md)',
                          fontSize: '0.75rem',
                          color: 'var(--cascivo-text-secondary)',
                        }}
                      >
                        Preview pending
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </article>
  )
}
