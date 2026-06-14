import { type ComponentType, Suspense, lazy } from 'react'
import { useSignalEffect } from '@cascivo/core'
import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Principles } from './sections/Principles'
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
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'

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
const OgCard = lazy(() => import('./sections/OgCard').then((m) => ({ default: m.OgCard })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

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
  '/og': { Page: OgCard, title: 'cascivo' },
}

export function App() {
  useSignalEffect(() => initReveal())

  const pathname =
    typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/'
  const route = ROUTES[pathname]

  if (!route) {
    applyNotFoundSeo()
    return (
      <Suspense fallback={<SectionFallback tall />}>
        <NotFound />
      </Suspense>
    )
  }

  applyRouteSeo(pathname, route.title)

  return (
    <Suspense fallback={<SectionFallback tall />}>
      <route.Page />
    </Suspense>
  )
}
