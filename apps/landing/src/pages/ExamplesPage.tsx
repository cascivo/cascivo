import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { DEMOS } from './examples/data'

export function ExamplesPage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section
            id="examples-top"
            className="proof-hero"
            aria-label="Example dashboards overview"
          >
            <p className="guides-eyebrow">Examples</p>
            <h1>Drive it, don&rsquo;t read about it.</h1>
            <p className="proof-hero-sub">
              Five functional dashboards, each modelled on a well-known SaaS product and built
              entirely with cascivo. No backend, no accounts, no setup — open one and play. Together
              they exercise every component and every chart in the library.
            </p>
          </section>

          <section className="section examples-hub" aria-label="All example dashboards">
            <ul className="examples-hub-grid">
              {DEMOS.map((demo) => (
                <li key={demo.slug} className="examples-hub-card">
                  <a className="examples-hub-thumb-link" href={demo.detailHref}>
                    <img
                      className="examples-hub-thumb"
                      src={demo.screenshots.desktopLight}
                      alt={`${demo.name} dashboard`}
                      width={1280}
                      height={800}
                      loading="lazy"
                    />
                  </a>
                  <div className="examples-hub-body">
                    <div className="examples-card-header">
                      <span className="examples-name">{demo.name}</span>
                      <span className="examples-feels-like">feels like {demo.feelsLike}</span>
                    </div>
                    <p className="examples-desc">{demo.tagline}</p>
                    <ul className="examples-chips" aria-label="Featured components">
                      {demo.coverage.map((chip) => (
                        <li key={chip} className="examples-chip">
                          {chip}
                        </li>
                      ))}
                    </ul>
                    <div className="examples-card-footer">
                      <a className="examples-link" href={demo.detailHref}>
                        View details &rarr;
                      </a>
                      <a className="examples-link examples-link--live" href={demo.liveHref}>
                        Open live demo &rarr;
                      </a>
                    </div>
                    <span className="examples-mock-note">Mock demo &mdash; no real data</span>
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
