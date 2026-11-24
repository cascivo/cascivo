import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { LinkButton } from '../sections/LinkButton'
import { FAMILIES, familyCssFamily } from './fonts/families'
import './cascivo-sans/font.css'
import './fonts/fonts.css'
import '../font-faces/mono.css'
import '../font-faces/serif.css'
import '../font-faces/condensed.css'

const SAMPLE = 'Signals move fast; the cascade decides.'

/** The four cards, Sans first. Sans keeps its own page and faces (cascivo-sans/font.css). */
export const HUB_CARDS = [
  {
    name: 'Cascivo Sans',
    route: '/cascivo-sans',
    css: "'Cascivo Sans', var(--cascivo-font-sans)",
    summary:
      'The interface sans. Weight 100–900, optical size 8–48, upright and italic, Latin, Cyrillic and Greek.',
  },
  ...FAMILIES.map((f) => ({
    name: f.name,
    route: f.route,
    css: familyCssFamily(f),
    summary: f.summary,
  })),
] as const

/** /fonts — one entry point to every Cascivo typeface. */
export function FontsPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main className="cs-page">
          <section className="proof-hero" aria-labelledby="cs-fonts-title">
            <p className="guides-eyebrow">Typefaces</p>
            <h1 id="cs-fonts-title" className="cs-hero-title">
              Cascivo fonts
            </h1>
            <p className="proof-hero-sub">
              Four open variable fonts drawn by the same engine: Sans, Mono, Serif and Condensed.
              Pick one for the whole site from the “Aa” menu in the header.
            </p>
          </section>
          <section className="cs-section" aria-label="Font families">
            <ul className="cs-family-cards" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {HUB_CARDS.map((card) => (
                <li key={card.route} className="cs-family-card">
                  <h2>{card.name}</h2>
                  <p
                    className="cs-family-sample"
                    style={{ fontFamily: card.css }}
                    aria-hidden="true"
                  >
                    {SAMPLE}
                  </p>
                  <p>{card.summary}</p>
                  <div className="cs-hero-actions">
                    <LinkButton href={card.route}>Open {card.name}</LinkButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
