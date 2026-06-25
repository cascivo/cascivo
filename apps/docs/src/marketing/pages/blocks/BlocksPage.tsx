import { Suspense, lazy } from 'react'
import { useComputed, useResizeObserver, useSignal, useSignals } from '@cascivo/core'
import { Badge, Button, Input } from '@cascivo/react'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../../sections/Header'
import { Footer } from '../../sections/Footer'
import { type BlockCategory, type BlockEntry, BLOCKS } from './blocks-data'
import './blocks.css'

const CATEGORIES: Array<{ key: BlockCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'auth', label: 'Auth' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'shell', label: 'Shell' },
]

// The blocks are authored against a desktop canvas; the thumbnail renders the
// real component at this width and scales it down to fit the card.
const PREVIEW_WIDTH = 1280

// Cache lazy components by block name so re-renders (filter/search) don't create
// new lazy instances and re-trigger their chunk loads.
const lazyCache = new Map<string, ReturnType<typeof lazy>>()

function getLazyBlock(entry: BlockEntry) {
  const name = entry.meta.name
  if (!lazyCache.has(name)) {
    lazyCache.set(name, lazy(entry.load))
  }
  return lazyCache.get(name)!
}

/** Live, scaled-down render of the real block — replaces a static screenshot. */
function BlockThumbnail({ entry }: { entry: BlockEntry }) {
  useSignals()
  const { ref, size } = useResizeObserver<HTMLDivElement>()
  const scale = useComputed(() => {
    const width = size.value?.width
    return width ? width / PREVIEW_WIDTH : null
  })
  const Block = getLazyBlock(entry)

  return (
    <div ref={ref} className="block-card__preview" aria-hidden="true">
      <div
        className="block-card__preview-frame"
        style={{
          inlineSize: `${PREVIEW_WIDTH}px`,
          transform: scale.value != null ? `scale(${scale.value})` : undefined,
          // Avoid a full-size flash before the first measurement lands.
          visibility: scale.value != null ? 'visible' : 'hidden',
        }}
      >
        <Suspense fallback={null}>
          <Block />
        </Suspense>
      </div>
    </div>
  )
}

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
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
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
                  <BlockThumbnail entry={entry} />
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
      </SkipNavTarget>
      <Footer />
    </>
  )
}
