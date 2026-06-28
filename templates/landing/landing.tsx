import './landing.module.css'
import { landingFixtures } from './fixtures'

// Components installed via this template's registryDependencies: button, card,
// badge. After install they live in your components directory — swap them in for
// the placeholder elements below.

/**
 * Marketing landing template page. Owned, copy-paste source — adapt freely.
 * Presentational only: no useState/useEffect (cascade house rules).
 */
export function LandingPage() {
  const { eyebrow, headline, subhead, cta, features } = landingFixtures
  return (
    <main className="landing">
      <section className="landing__hero">
        <p className="landing__eyebrow">{eyebrow}</p>
        <h1>{headline}</h1>
        <p className="landing__subhead">{subhead}</p>
        <a className="landing__cta" href={cta.href}>
          {cta.label}
        </a>
      </section>

      <section className="landing__features" aria-label="Features">
        {features.map((f) => (
          <article key={f.title} className="landing__feature">
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
