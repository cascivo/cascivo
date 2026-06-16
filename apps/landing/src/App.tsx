import { type ComponentType, Suspense, lazy } from 'react'
import { useSignalEffect, useSignals } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Principles } from './sections/Principles'
import { TechDeepDive } from './sections/TechDeepDive'
import { StatsBand } from './sections/StatsBand'
import { SignalsDemo } from './sections/SignalsDemo'
import { ProofTeasers } from './sections/ProofTeasers'
import { AgentLayer } from './sections/AgentLayer'
import { ThemeDemo } from './sections/ThemeDemo'
import { ExamplesGallery } from './sections/ExamplesGallery'
import { Ecosystem } from './sections/Ecosystem'
import { QuickStart } from './sections/QuickStart'
import { CtaBand } from './sections/CtaBand'
import { Footer } from './sections/Footer'
import { initReveal } from './reveal'
import { currentPath, initRouter, navigate } from './router'
import { SearchDialog } from '@cascivo/search/SearchDialog'
import { landingIndex } from './search/buildIndex'
import { searchOpen } from './search/state'
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'
import { DEMOS } from './pages/examples/data'

// Heavy below-the-fold home sections — split into their own chunks so the
// initial home JS shrinks. Hero/above-the-fold stay eager (protect LCP).
const RelayConsole = lazy(() =>
  import('./demo/RelayConsole').then((m) => ({ default: m.RelayConsole })),
)
const ChartShowcase = lazy(() =>
  import('./sections/ChartShowcase').then((m) => ({ default: m.ChartShowcase })),
)

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
const ExamplesPage = lazy(() =>
  import('./pages/ExamplesPage').then((m) => ({ default: m.ExamplesPage })),
)
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

/** Reserved-height placeholder for a lazy section/route (avoids CLS on load). */
function SectionFallback({ tall = false }: { tall?: boolean }) {
  return (
    <div className={tall ? 'lazy-fallback lazy-fallback--tall' : 'lazy-fallback'} aria-hidden />
  )
}

function HomePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <Hero />
          <Principles />
          <TechDeepDive teaser />
          <StatsBand />
          <Suspense fallback={<SectionFallback tall />}>
            <RelayConsole />
          </Suspense>
          <SignalsDemo />
          <ProofTeasers />
          <AgentLayer />
          <ThemeDemo />
          <Suspense fallback={<SectionFallback tall />}>
            <ChartShowcase />
          </Suspense>
          <ExamplesGallery />
          <Ecosystem />
          <QuickStart />
          <CtaBand />
        </main>
      </SkipNavTarget>
      <Footer />
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
  '/examples': { Page: ExamplesPage, title: ROUTE_HEAD['/examples']?.title ?? 'cascivo' },
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
    requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    })
    return
  }
  navigate(href)
}

export function App() {
  useSignals()
  useSignalEffect(() => initReveal())
  useSignalEffect(() => {
    initRouter()
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

  const search = (
    <SearchDialog
      index={landingIndex}
      open={searchOpen.value}
      onClose={() => {
        searchOpen.value = false
      }}
      onNavigate={navigateToResult}
    />
  )

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
