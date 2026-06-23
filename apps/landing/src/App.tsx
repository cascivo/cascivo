import { type ComponentType, Suspense, lazy } from 'react'
import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { AdvantageCarousel } from './sections/AdvantageCarousel'
import { SectionNav } from './sections/SectionNav'
import { initReveal } from './reveal'
import { peek } from './peek'
import { currentPath, initRouter, navigate, scrollToHash } from './router'
const SearchDialog = lazy(() =>
  import('@cascivo/search/SearchDialog').then((m) => ({ default: m.SearchDialog })),
)
import { landingIndex } from './search/buildIndex'
import { searchOpen } from './search/state'
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'
import { DEMOS } from './pages/examples/data'

// Heavy below-the-fold home sections — split into their own chunks so the
// initial home JS shrinks. Hero/above-the-fold stay eager (protect LCP).
// The component backdrop is decorative; lazy so its ~two-dozen demos never
// weigh on the initial paint.
const ComponentField = lazy(() =>
  import('./sections/ComponentField').then((m) => ({ default: m.ComponentField })),
)
const QuickStart = lazy(() =>
  import('./sections/QuickStart').then((m) => ({ default: m.QuickStart })),
)
const CtaBand = lazy(() => import('./sections/CtaBand').then((m) => ({ default: m.CtaBand })))
const Footer = lazy(() => import('./sections/Footer').then((m) => ({ default: m.Footer })))

// Non-home routes — loaded on demand, never in the home bundle.
const AccessibilityPage = lazy(() =>
  import('./pages/AccessibilityPage').then((m) => ({ default: m.AccessibilityPage })),
)
const PerformancePage = lazy(() =>
  import('./pages/PerformancePage').then((m) => ({ default: m.PerformancePage })),
)
const GuidesPage = lazy(() => import('./pages/GuidesPage').then((m) => ({ default: m.GuidesPage })))
const ModernCssPage = lazy(() =>
  import('./pages/ModernCssPage').then((m) => ({ default: m.ModernCssPage })),
)
const HighlightsPage = lazy(() =>
  import('./pages/HighlightsPage').then((m) => ({ default: m.HighlightsPage })),
)
const ExamplesPage = lazy(() =>
  import('./pages/ExamplesPage').then((m) => ({ default: m.ExamplesPage })),
)
const ShowcasePage = lazy(() =>
  import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })),
)
const AiPage = lazy(() => import('./pages/AiPage').then((m) => ({ default: m.AiPage })))
const ExampleDetailPage = lazy(() =>
  import('./pages/ExampleDetailPage').then((m) => ({ default: m.ExampleDetailPage })),
)
const OgCard = lazy(() => import('./sections/OgCard').then((m) => ({ default: m.OgCard })))
const CreatePage = lazy(() => import('./pages/CreatePage').then((m) => ({ default: m.CreatePage })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))
const BlocksPage = lazy(() =>
  import('./pages/blocks/BlocksPage').then((m) => ({ default: m.BlocksPage })),
)
const BlockDetailPage = lazy(() =>
  import('./pages/blocks/BlockDetailPage').then((m) => ({ default: m.BlockDetailPage })),
)
const BlockPreviewPage = lazy(() =>
  import('./pages/blocks/BlockPreviewPage').then((m) => ({ default: m.BlockPreviewPage })),
)

/** Reserved-height placeholder for a lazy section/route (avoids CLS on load). */
function SectionFallback({ tall = false, height }: { tall?: boolean; height?: number }) {
  return (
    <div
      className={tall ? 'lazy-fallback lazy-fallback--tall' : 'lazy-fallback'}
      style={height !== undefined ? { minBlockSize: height } : undefined}
      aria-hidden
    />
  )
}

function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <ComponentField />
      </Suspense>
      <SkipNavLink />
      <Header />
      <SectionNav />
      <div className="home-sheet">
        <SkipNavTarget>
          <main>
            <Hero />
            <hr className="flow-divider" />
            <AdvantageCarousel />
            <hr className="flow-divider" />
            <Suspense fallback={<SectionFallback height={420} />}>
              <QuickStart />
            </Suspense>
            <hr className="flow-divider" />
            <Suspense fallback={<SectionFallback height={180} />}>
              <CtaBand />
            </Suspense>
          </main>
        </SkipNavTarget>
        <Suspense fallback={<SectionFallback height={260} />}>
          <Footer />
        </Suspense>
      </div>
    </>
  )
}

type Route = { Page: ComponentType; title: string }

// Titles come from ROUTE_HEAD (single source of truth shared with the build-time
// prerender). `/og` is a render target with its own title, not in ROUTE_HEAD.
const ROUTES: Record<string, Route> = {
  '/': { Page: HomePage, title: ROUTE_HEAD['/']?.title ?? 'cascivo' },
  '/accessibility': {
    Page: AccessibilityPage,
    title: ROUTE_HEAD['/accessibility']?.title ?? 'cascivo',
  },
  '/performance': { Page: PerformancePage, title: ROUTE_HEAD['/performance']?.title ?? 'cascivo' },
  '/guides': { Page: GuidesPage, title: ROUTE_HEAD['/guides']?.title ?? 'cascivo' },
  '/modern-css': { Page: ModernCssPage, title: ROUTE_HEAD['/modern-css']?.title ?? 'cascivo' },
  '/highlights': { Page: HighlightsPage, title: ROUTE_HEAD['/highlights']?.title ?? 'cascivo' },
  '/examples': { Page: ExamplesPage, title: ROUTE_HEAD['/examples']?.title ?? 'cascivo' },
  '/showcase': { Page: ShowcasePage, title: ROUTE_HEAD['/showcase']?.title ?? 'cascivo' },
  '/ai': { Page: AiPage, title: ROUTE_HEAD['/ai']?.title ?? 'cascivo' },
  '/og': { Page: OgCard, title: 'cascivo' },
  '/create': {
    Page: CreatePage,
    title: ROUTE_HEAD['/create']?.title ?? 'cascivo',
  },
  '/blocks': {
    Page: BlocksPage,
    title: ROUTE_HEAD['/blocks']?.title ?? 'cascivo',
  },
  // One detail route per demo (/examples/<slug>); titles from ROUTE_HEAD.
  ...Object.fromEntries(
    DEMOS.map((d) => [
      d.detailHref,
      { Page: ExampleDetailPage, title: ROUTE_HEAD[d.detailHref]?.title ?? 'cascivo' },
    ]),
  ),
}

/**
 * Navigate to a search result. External (docs) links are full browser
 * navigations — `history.pushState` would throw on a cross-origin URL.
 * Same-origin hash links navigate to the path, then jump to the anchor.
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
  const hasOpenedSearch = useSignal(false)
  useSignalEffect(() => {
    if (searchOpen.value) hasOpenedSearch.value = true
  })
  useSignalEffect(() => initReveal())
  useSignalEffect(() => {
    initRouter()
  })

  // Drive the home "peek" gimmick via a root attribute the CSS reacts to.
  // Reset and gate on the home route so it can never strand another page.
  useSignalEffect(() => {
    const home = currentPath.value === '/'
    if (!home && peek.value) peek.value = false
    document.documentElement.toggleAttribute('data-peek', home && peek.value)
  })

  // CMD+K / Ctrl+K opens the search dialog.
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
  const route = ROUTES[pathname]

  const search = hasOpenedSearch.value ? (
    <Suspense fallback={null}>
      <SearchDialog
        index={landingIndex}
        open={searchOpen.value}
        onClose={() => {
          searchOpen.value = false
        }}
        onNavigate={navigateToResult}
      />
    </Suspense>
  ) : null

  // Handle /blocks/preview/:name — bare preview page (no header/footer)
  if (pathname.startsWith('/blocks/preview/')) {
    const blockName = pathname.slice('/blocks/preview/'.length).split('/')[0]
    if (blockName) {
      applyRouteSeo(pathname, `${blockName} preview — cascivo`)
      return (
        <Suspense fallback={null}>
          <BlockPreviewPage name={blockName} />
        </Suspense>
      )
    }
  }

  // Handle /blocks/:name dynamic route
  if (pathname.startsWith('/blocks/') && pathname !== '/blocks/') {
    const blockName = pathname.slice('/blocks/'.length).split('/')[0]
    if (blockName) {
      applyRouteSeo(pathname, `${blockName} — cascivo`)
      return (
        <>
          <Suspense fallback={<SectionFallback tall />}>
            <BlockDetailPage name={blockName} />
          </Suspense>
          {search}
        </>
      )
    }
  }

  if (!route) {
    applyNotFoundSeo()
    return (
      <>
        <Suspense fallback={<SectionFallback tall />}>
          <NotFound />
        </Suspense>
        {search}
      </>
    )
  }

  applyRouteSeo(pathname, route.title)

  return (
    <>
      <Suspense fallback={<SectionFallback tall />}>
        <route.Page />
      </Suspense>
      {search}
    </>
  )
}
