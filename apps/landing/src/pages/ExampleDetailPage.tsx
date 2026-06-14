import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { LinkButton } from '../sections/LinkButton'
import { type Demo, demoBySlug } from './examples/data'

/** The current /examples/<slug> from the pathname (exact route → always present). */
function currentDemo(): Demo | undefined {
  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : ''
  const slug = path.split('/').pop() ?? ''
  return demoBySlug(slug)
}

const SHOTS = [
  { key: 'desktopLight', label: 'Desktop · light', theme: 'light' },
  { key: 'desktopDark', label: 'Desktop · dark', theme: 'dark' },
  { key: 'mobileLight', label: 'Mobile · light', theme: 'light' },
  { key: 'mobileDark', label: 'Mobile · dark', theme: 'dark' },
] as const

export function ExampleDetailPage() {
  const demo = currentDemo()

  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          {!demo ? (
            <section className="proof-hero" aria-label="Example not found">
              <h1>Demo not found</h1>
              <p className="proof-hero-sub">
                <a className="examples-link" href="/examples">
                  &larr; Back to all demos
                </a>
              </p>
            </section>
          ) : (
            <>
              <section
                id="example-top"
                className="proof-hero example-detail-hero"
                aria-label={`${demo.name} overview`}
              >
                <p className="guides-eyebrow">Example · feels like {demo.feelsLike}</p>
                <h1>{demo.name}</h1>
                <p className="proof-hero-sub">{demo.description}</p>
                <div className="example-detail-ctas">
                  <LinkButton href={demo.liveHref} variant="primary">
                    Open live demo &rarr;
                  </LinkButton>
                  <a className="examples-link" href="/examples">
                    &larr; All demos
                  </a>
                </div>
                <p className="examples-mock-note">
                  Mock demo &mdash; seeded client-side data, no backend, no real accounts.
                </p>
              </section>

              <section className="section example-detail-shots" aria-label="Screenshots">
                <div className="example-shots-grid">
                  {SHOTS.map((shot) => (
                    <figure key={shot.key} className="example-shot" data-theme={shot.theme}>
                      <img
                        className="example-shot-img"
                        src={demo.screenshots[shot.key]}
                        alt={`${demo.name} — ${shot.label}`}
                        loading="lazy"
                      />
                      <figcaption className="example-shot-caption">{shot.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>

              <section className="section example-detail-proves" aria-label="What it proves">
                <h2>What it proves</h2>
                <p className="example-proves-text">{demo.proves}</p>
                <ul className="examples-chips" aria-label="Featured components">
                  {demo.coverage.map((chip) => (
                    <li key={chip} className="examples-chip">
                      {chip}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="section example-detail-cta" aria-label="Open the demo">
                <h2>See it for yourself</h2>
                <p className="section-sub">
                  Open the live {demo.name} demo and drive it — click, filter, and mutate. Your
                  changes persist across a reload.
                </p>
                <LinkButton href={demo.liveHref} variant="primary">
                  Open live demo &rarr;
                </LinkButton>
              </section>
            </>
          )}
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
