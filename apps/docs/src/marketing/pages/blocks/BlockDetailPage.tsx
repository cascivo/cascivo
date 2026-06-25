import { Suspense, lazy } from 'react'
import type { VNode } from 'preact'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { Button } from '@cascivo/react'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../../sections/Header'
import { Footer } from '../../sections/Footer'
import { findBlock, type BlockEntry } from './blocks-data'
import './blocks.css'

type Props = { name: string }

const VIEWPORTS = [
  { label: '320', value: '20rem' },
  { label: '768', value: '48rem' },
  { label: '1280', value: '80rem' },
] as const

type ThemeKey = 'light' | 'dark'

// Cache lazy components by block name to avoid re-creating on re-render.
const lazyCache = new Map<string, ReturnType<typeof lazy>>()

function getLazyBlock(entry: BlockEntry) {
  const name = entry.meta.name
  if (!lazyCache.has(name)) {
    lazyCache.set(name, lazy(entry.load))
  }
  return lazyCache.get(name)!
}

export function BlockDetailPage({ name }: Props) {
  useSignals()
  const entry = findBlock(name)

  if (!entry) {
    return (
      <>
        <SkipNavLink />
        <Header />
        <SkipNavTarget>
          <main className="block-detail">
            <a href="/blocks" className="block-detail__back">
              ← Back to Blocks
            </a>
            <p>Block &quot;{name}&quot; not found.</p>
          </main>
        </SkipNavTarget>
        <Footer />
      </>
    )
  }

  return <BlockDetailInner entry={entry} name={name} />
}

type InnerProps = { entry: BlockEntry; name: string }

function BlockDetailInner({ entry, name }: InnerProps) {
  useSignals()
  const previewTheme = useSignal<ThemeKey>('light')
  const viewport = useSignal<string>('80rem')
  const activeTab = useSignal<'tsx' | 'css'>('tsx')
  const copyLabel = useSignal('Copy')
  const cmdCopyLabel = useSignal('Copy')

  const Block = getLazyBlock(entry) as unknown as (props: Record<string, never>) => VNode

  const tsxSource = `// Run: npx cascivo add block/${name}\n// Source: packages/components/src/blocks/${name}/${name}.tsx`
  const cssSource = `/* Run: npx cascivo add block/${name} */\n/* Source: packages/components/src/blocks/${name}/${name}.module.css */`

  const displayedCode = useComputed(() => (activeTab.value === 'tsx' ? tsxSource : cssSource))

  function copyCode() {
    void navigator.clipboard.writeText(displayedCode.value).then(() => {
      copyLabel.value = 'Copied!'
      setTimeout(() => {
        copyLabel.value = 'Copy'
      }, 1500)
    })
  }

  function copyCmd() {
    void navigator.clipboard.writeText(`npx cascivo add block/${name}`).then(() => {
      cmdCopyLabel.value = 'Copied!'
      setTimeout(() => {
        cmdCopyLabel.value = 'Copy'
      }, 1500)
    })
  }

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="block-detail">
          <a href="/blocks" className="block-detail__back">
            ← Back to Blocks
          </a>

          <h1 className="block-detail__heading">{entry.meta.displayName}</h1>
          <p className="block-detail__description">{entry.meta.description}</p>

          <div className="block-detail__controls">
            <div className="block-detail__controls-group">
              {(['light', 'dark'] as ThemeKey[]).map((t) => (
                <Button
                  key={t}
                  variant={previewTheme.value === t ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    previewTheme.value = t
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>

            <div className="block-detail__controls-group">
              {VIEWPORTS.map((v) => (
                <Button
                  key={v.label}
                  variant={viewport.value === v.value ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    viewport.value = v.value
                  }}
                >
                  {v.label}
                </Button>
              ))}
            </div>

            <a
              href={`/blocks/preview/${name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block-detail__open-link"
            >
              Open full tab ↗
            </a>
          </div>

          <div className="block-detail__preview-wrapper" style={{ maxInlineSize: viewport.value }}>
            <div className="block-detail__preview-inner" data-theme={previewTheme.value}>
              <Suspense
                fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}
              >
                <Block />
              </Suspense>
            </div>
          </div>

          <div className="block-detail__code-section">
            <div className="block-detail__tabs" role="tablist">
              {(['tsx', 'css'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab.value === tab}
                  className="block-detail__tab"
                  onClick={() => {
                    activeTab.value = tab
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="block-detail__code-panel">
              <div className="block-detail__code-copy">
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  {copyLabel.value}
                </Button>
              </div>
              <pre className="block-detail__code-pre">
                <code>{displayedCode.value}</code>
              </pre>
            </div>
          </div>

          <div className="block-detail__install">
            <code className="block-detail__install-cmd">npx cascivo add block/{name}</code>
            <Button variant="ghost" size="sm" onClick={copyCmd}>
              {cmdCopyLabel.value}
            </Button>
          </div>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
