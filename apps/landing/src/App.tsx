import type { ComponentType } from 'react'
import { useSignalEffect } from '@cascade-ui/core'
import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Principles } from './sections/Principles'
import { StatsBand } from './sections/StatsBand'
import { RelayConsole } from './demo/RelayConsole'
import { SignalsDemo } from './sections/SignalsDemo'
import { AgentLayer } from './sections/AgentLayer'
import { ThemeDemo } from './sections/ThemeDemo'
import { QuickStart } from './sections/QuickStart'
import { CtaBand } from './sections/CtaBand'
import { Footer } from './sections/Footer'
import { OgCard } from './sections/OgCard'
import { AccessibilityPage } from './pages/AccessibilityPage'
import { PerformancePage } from './pages/PerformancePage'
import { initReveal } from './reveal'

function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Principles />
      <StatsBand />
      <RelayConsole />
      <SignalsDemo />
      <AgentLayer />
      <ThemeDemo />
      <QuickStart />
      <CtaBand />
      <Footer />
    </>
  )
}

type Route = { Page: ComponentType; title: string }

const HOME: Route = {
  Page: HomePage,
  title: 'cascade — the CSS-native, signal-driven, AI-first React design system',
}

const ROUTES: Record<string, Route> = {
  '/': HOME,
  '/accessibility': { Page: AccessibilityPage, title: 'Accessibility — cascade' },
  '/performance': { Page: PerformancePage, title: 'Performance — cascade' },
  '/og': { Page: OgCard, title: 'cascade' },
}

export function App() {
  useSignalEffect(() => initReveal())

  const pathname =
    typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/'
  const route = ROUTES[pathname] ?? HOME

  if (typeof document !== 'undefined') {
    document.title = route.title
  }

  return <route.Page />
}
