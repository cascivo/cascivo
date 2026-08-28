import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { TechDeepDive } from '../sections/TechDeepDive'

export function ModernCssPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section className="proof-hero" aria-labelledby="modern-css-title">
            <p className="guides-eyebrow">Modern CSS</p>
            <h1 id="modern-css-title">
              Modern CSS <span className="proof-hero-accent">changes the rules</span>.
            </h1>
            <p className="proof-hero-sub">
              Most UI libraries use JavaScript to manage state that CSS can already express. cascivo
              uses <code>@layer</code>, <code>@container</code>, and <code>:has()</code> to
              eliminate runtime overhead, specificity conflicts, and JS-driven visual state —
              everywhere they apply.
            </p>
          </section>
          <TechDeepDive />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
