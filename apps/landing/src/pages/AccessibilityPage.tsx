import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'

export function AccessibilityPage() {
  return (
    <>
      <Header />
      <section className="hero">
        <h1 className="hero-title">
          Accessibility, <span className="hero-title-accent">measured.</span>
        </h1>
        <p className="hero-sub">
          Every cascade component ships machine-readable accessibility metadata, and the library is
          axe-audited on every commit. This page assembles the evidence — landing in v10 tranche 3.
        </p>
      </section>
      <Footer />
    </>
  )
}
