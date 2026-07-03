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
  { key: 'desktopLight', label: 'Desktop · light', theme: 'light', width: 1280, height: 800 },
  { key: 'desktopDark', label: 'Desktop · dark', theme: 'dark', width: 1280, height: 800 },
  { key: 'mobileLight', label: 'Mobile · light', theme: 'light', width: 390, height: 844 },
  { key: 'mobileDark', label: 'Mobile · dark', theme: 'dark', width: 390, height: 844 },
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
                  {SHOTS.map((shot, i) => (
                    <figure key={shot.key} className="example-shot" data-theme={shot.theme}>
                      <img
                        className="example-shot-img"
                        src={demo.screenshots[shot.key]}
                        alt={`${demo.name} — ${shot.label}`}
                        width={shot.width}
                        height={shot.height}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        {...(i === 0 ? { fetchpriority: 'high' as const } : {})}
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

              <section
                className="section example-detail-start"
                aria-label="Start from this example"
              >
                <h2>Start from this example</h2>
                <p className="section-sub">
                  Three ways to build on {demo.name} — run it, lift the source, or scaffold your own
                  on the same foundation.
                </p>
                <div className="example-start-grid">
                  <article className="example-start-card">
                    <span className="example-start-step">1</span>
                    <h3>Run &amp; tinker</h3>
                    <p>Clone the repo and start this exact example in the workspace.</p>
                    <pre className="tech-pre">
                      <code>{`git clone https://github.com/cascivo/cascivo
cd cascivo && pnpm install
pnpm --filter @cascivo/example-${demo.slug} dev`}</code>
                    </pre>
                  </article>

                  <article className="example-start-card">
                    <span className="example-start-step">2</span>
                    <h3>Copy the source</h3>
                    <p>
                      Grab this example&rsquo;s files to lift its composition into your project.
                    </p>
                    <pre className="tech-pre">
                      <code>{`npx degit cascivo/cascivo/apps/examples/${demo.slug} ${demo.slug}-app`}</code>
                    </pre>
                    <p className="example-start-note">
                      Wired for the monorepo — point the <code>@cascivo/*</code> imports at the
                      published packages to run it on its own.
                    </p>
                  </article>

                  <article className="example-start-card">
                    <span className="example-start-step">3</span>
                    <h3>Scaffold your own</h3>
                    <p>
                      A fresh, standalone cascivo app with the same app shell and theme — then add
                      the components this example uses.
                    </p>
                    <pre className="tech-pre">
                      <code>{`npx cascivo create ${demo.slug}-app
cd ${demo.slug}-app && npm install
npx cascivo add data-table stat badge`}</code>
                    </pre>
                  </article>
                </div>
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
