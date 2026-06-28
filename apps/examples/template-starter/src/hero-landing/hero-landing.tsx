import './hero-landing.module.css'
import { heroLandingFixtures } from './fixtures'

// Components installed via the template's registryDependencies: button, card.
// After `cascivo add your-org/template-starter/hero-landing` they live in your
// components directory — import them from there and compose below.

/**
 * Hero landing template page. Owned, copy-paste source — adapt freely.
 * Presentational only: no useState/useEffect (cascade house rules).
 */
export function HeroLandingPage() {
  const { headline, subhead, features } = heroLandingFixtures
  return (
    <main className="hero-landing">
      <section className="hero-landing__hero">
        <h1>{headline}</h1>
        <p>{subhead}</p>
      </section>
      <section className="hero-landing__features">
        {features.map((f) => (
          <article key={f.title} className="hero-landing__feature">
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
