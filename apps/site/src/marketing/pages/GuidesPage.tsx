import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { GuidesHero } from './guides/GuidesHero'
import { GuidesCta } from './guides/GuidesCta'
import { Ecosystem } from '../sections/Ecosystem'

const GUIDE_LINKS = [
  {
    title: 'Coming from shadcn/ui?',
    teaser:
      "What transfers for free, what changes, and whether it's worth it — with live bundle and accessibility deltas.",
    href: '/guides/coming-from-shadcn',
  },
  {
    title: 'Make it yours',
    teaser:
      'Three-tier token overrides — rebrand in one line, brand a single component, or theme any subtree.',
    href: '/guides/customization',
  },
  {
    title: 'When is cascivo the right call?',
    teaser:
      'Five scenarios where cascivo earns its place, each mapped to the receipt that proves it.',
    href: '/guides/use-cases',
  },
  {
    title: 'When not to use cascivo',
    teaser:
      'Candid limits — Chrome-leading CSS pilots, alpha tooling, React/Preact only — with honest receipts.',
    href: '/guides/when-not-to-use',
  },
  {
    title: 'Quick questions',
    teaser: 'The things people ask before they commit, each answer ending in where to go next.',
    href: '/guides/faq',
  },
] as const

export function GuidesPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <GuidesHero />
          <section className="guides-section" aria-label="Browse guides">
            <ul className="scenario-grid">
              {GUIDE_LINKS.map((g) => (
                <li key={g.href} className="scenario-card">
                  <h2 className="scenario-persona">
                    <a href={g.href}>{g.title} →</a>
                  </h2>
                  <p className="scenario-situation">{g.teaser}</p>
                </li>
              ))}
            </ul>
          </section>
          <Ecosystem />
          <GuidesCta />
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
