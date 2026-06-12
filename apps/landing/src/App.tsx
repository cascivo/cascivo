import { Header } from './sections/Header'
import { Hero } from './sections/Hero'
import { Principles } from './sections/Principles'
import { RelayConsole } from './demo/RelayConsole'
import { SignalsDemo } from './sections/SignalsDemo'
import { AgentLayer } from './sections/AgentLayer'
import { ThemeDemo } from './sections/ThemeDemo'
import { QuickStart } from './sections/QuickStart'
import { CtaBand } from './sections/CtaBand'
import { Footer } from './sections/Footer'
import { OgCard } from './sections/OgCard'

export function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/og') {
    return <OgCard />
  }

  return (
    <>
      <Header />
      <Hero />
      <Principles />
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
