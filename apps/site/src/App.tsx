import { Suspense, lazy } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { currentPath, initRouter, navigate, scrollToHash } from './router'
import { initReveal } from './marketing/reveal'
import { peek } from './marketing/peek'
import { searchOpen } from './marketing/search/state'
import { MarketingApp } from './marketing/App'
import { theme } from './theme'

// The dialog AND its index (built from registry.json, ~130 KB gzip) live behind
// this one lazy boundary, so the registry never lands in the home entry chunk.
const SearchDialogLazy = lazy(() =>
  import('./marketing/search/SearchDialogLazy').then((m) => ({ default: m.SearchDialogLazy })),
)

// Docs surface (every component page, AppShell, charts, editor, flow) is a large
// subtree only reached under /docs. Lazy so it never weighs on the home bundle —
// its JS and CSS load on demand instead of blocking the marketing landing page.
const DocsApp = lazy(() => import('./DocsApp').then((m) => ({ default: m.DocsApp })))

/**
 * Navigate to a search result. External links are full browser navigations
 * (`history.pushState` would throw cross-origin). Same-origin hash links jump to
 * the path, then to the anchor.
 */
function navigateToResult(href: string) {
  if (/^https?:\/\//.test(href)) {
    window.location.href = href
    return
  }
  const hashIndex = href.indexOf('#')
  if (hashIndex >= 0) {
    const path = href.slice(0, hashIndex) || '/'
    const hash = href.slice(hashIndex)
    navigate(path)
    scrollToHash(hash)
    return
  }
  navigate(href)
}

export function App() {
  useSignals()

  // Apply the stored theme before first paint (the theme module also keeps the
  // DOM in sync via an effect, but this avoids a flash on the very first render).
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  const hasOpenedSearch = useSignal(false)
  useSignalEffect(() => {
    if (searchOpen.value) hasOpenedSearch.value = true
  })

  // App-wide concerns owned by the root so they apply across both surfaces.
  useSignalEffect(() => initReveal())
  useSignalEffect(() => {
    initRouter()
  })

  // Home "peek" gimmick — gate on the home route so it can't strand another page.
  useSignalEffect(() => {
    const home = currentPath.value === '/'
    if (!home && peek.value) peek.value = false
    document.documentElement.toggleAttribute('data-peek', home && peek.value)
  })

  // Cmd+K / Ctrl+K opens the unified search dialog (components + pages).
  useSignalEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchOpen.value = true
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  const pathname = currentPath.value

  const search = hasOpenedSearch.value ? (
    <Suspense fallback={null}>
      <SearchDialogLazy
        open={searchOpen.value}
        onClose={() => {
          searchOpen.value = false
        }}
        onNavigate={navigateToResult}
      />
    </Suspense>
  ) : null

  const isDocs = pathname === '/docs' || pathname.startsWith('/docs/')

  return (
    <>
      {isDocs ? (
        <Suspense fallback={null}>
          <DocsApp />
        </Suspense>
      ) : (
        <MarketingApp />
      )}
      {search}
    </>
  )
}
