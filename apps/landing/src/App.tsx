import type { ComponentType } from 'react'
import { useSignalEffect } from '@cascivo/core'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Principles } from './sections/Principles'
import { StatsBand } from './sections/StatsBand'
import { RelayConsole } from './demo/RelayConsole'
import { SignalsDemo } from './sections/SignalsDemo'
import { ProofTeasers } from './sections/ProofTeasers'
import { AgentLayer } from './sections/AgentLayer'
import { ThemeDemo } from './sections/ThemeDemo'
import { ChartShowcase } from './sections/ChartShowcase'
import { Ecosystem } from './sections/Ecosystem'
import { QuickStart } from './sections/QuickStart'
import { CtaBand } from './sections/CtaBand'
import { Footer } from './sections/Footer'
import { OgCard } from './sections/OgCard'
import { AccessibilityPage } from './pages/AccessibilityPage'
import { PerformancePage } from './pages/PerformancePage'
import { GuidesPage } from './pages/GuidesPage'
import { NotFound } from './pages/NotFound'
import { initReveal } from './reveal'
import { applyNotFoundSeo, applyRouteSeo } from './seo'
import { ROUTE_HEAD } from './route-head'

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Principles />
      <StatsBand />
      <RelayConsole />
      <SignalsDemo />
      <ProofTeasers />
      <AgentLayer />
      <ThemeDemo />
      <ChartShowcase />
      <Ecosystem />
      <QuickStart />
      <CtaBand />
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
    return <NotFound />
  }

  applyRouteSeo(pathname, route.title)

  return <route.Page />
}
