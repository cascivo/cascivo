import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { Badge, Button, Input } from '@cascivo/react'
import { type BlockCategory, BLOCKS } from './blocks-data'
import './blocks.css'

const CATEGORIES: Array<{ key: BlockCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'auth', label: 'Auth' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'shell', label: 'Shell' },
]

export function BlocksPage() {
  useSignals()
  const activeCategory = useSignal<BlockCategory | 'all'>('all')
  const query = useSignal('')

  const displayed = useComputed(() => {
    const cat = activeCategory.value
    const q = query.value.toLowerCase()
    return BLOCKS.filter((b) => {
      const catMatch = cat === 'all' || b.meta.category === cat
      const qMatch =
        !q ||
        b.meta.name.toLowerCase().includes(q) ||
        b.meta.displayName.toLowerCase().includes(q) ||
        b.meta.description.toLowerCase().includes(q)
      return catMatch && qMatch
    })
  })

  return (
    <main className="blocks-page">
      <h1 className="blocks-page__heading">Blocks</h1>
      <p className="blocks-page__subtitle">
        Production-ready UI sections built with cascivo. Browse, preview, and copy in one click.
      </p>

      <div className="blocks-filter">
        {CATEGORIES.map((c) => (
          <Button
            key={c.key}
            variant={activeCategory.value === c.key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => {
              activeCategory.value = c.key
              query.value = ''
            }}
          >
            {c.label}
          </Button>
        ))}
      </div>

      <div className="blocks-search">
        <Input
          role="searchbox"
          type="search"
          placeholder="Search blocks…"
          value={query.value}
          onChange={(e) => {
            query.value = e.target.value
            activeCategory.value = 'all'
          }}
        />
      </div>

      <div className="blocks-grid">
        {displayed.value.length === 0 ? (
          <p className="blocks-empty">No blocks match your search.</p>
        ) : (
          displayed.value.map((entry) => (
            <a key={entry.meta.name} href={`/blocks/${entry.meta.name}`} className="block-card">
              <div className="block-card__screenshot">
                <img
                  src={entry.meta.screenshot.light}
                  alt={`${entry.meta.displayName} preview`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="block-card__body">
                <div className="block-card__header">
                  <span className="block-card__name">{entry.meta.displayName}</span>
                  <Badge variant="secondary">{entry.meta.category}</Badge>
                </div>
                <p className="block-card__description">{entry.meta.description}</p>
                <span className="block-card__link">View block →</span>
              </div>
            </a>
          ))
        )}
      </div>
    </main>
  )
}
