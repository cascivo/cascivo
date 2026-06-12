import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'

export function PerformancePage() {
  return (
    <>
      <Header />
      <section className="hero">
        <h1 className="hero-title">
          Performance, <span className="hero-title-accent">benchmarked.</span>
        </h1>
        <p className="hero-sub">
          cascade vs shadcn/ui vs Carbon — bundle size, interaction latency, re-render counts,
          Lighthouse, and axe, measured by one runner under disclosed conditions. Charts land in v10
          tranche 4.
        </p>
      </section>
      <Footer />
    </>
  )
}
