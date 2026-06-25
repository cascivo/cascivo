import { SkipNavLink, SkipNavTarget } from '@cascivo/components/skip-nav'
import { Header } from '../sections/Header'
import { Footer } from '../sections/Footer'
import { SHOWCASE, displayHost } from './showcase/data'

const REPO_DATA_URL =
  'https://github.com/cascivo/cascivo/edit/main/apps/landing/src/pages/showcase/data.ts'

export function ShowcasePage() {
  return (
    <>
      <SkipNavLink />
      <Header />
      <SkipNavTarget>
        <main>
          <section id="showcase-top" className="proof-hero" aria-label="Sites built with cascivo">
            <p className="guides-eyebrow">In the wild</p>
            <h1>Built with cascivo.</h1>
            <p className="proof-hero-sub">
              Real, shipped products using the cascivo design system — from a one-tap payment-link
              tool to a developer SDK and a content directory. Proof the library holds up beyond the
              docs.
            </p>
          </section>

          <section className="section showcase-hub" aria-label="Showcase sites">
            <ul className="showcase-grid">
              {SHOWCASE.map((site) => {
                const host = displayHost(site.url)
                return (
                  <li key={site.slug} className="showcase-card">
                    <a
                      className="showcase-frame"
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${site.name}`}
                    >
                      <span className="showcase-chrome" aria-hidden="true">
                        <span className="showcase-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                        <span className="showcase-omnibar">{host}</span>
                      </span>
                      <span className="showcase-shot">
                        <img
                          src={`/showcase/${site.slug}.jpg`}
                          alt={`Screenshot of ${site.name}`}
                          width={1280}
                          height={800}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    </a>
                    <div className="showcase-body">
                      <div className="showcase-head">
                        <span className="showcase-name">{site.name}</span>
                        <span className="showcase-cat">{site.category}</span>
                      </div>
                      <p className="showcase-tagline">{site.tagline}</p>
                      <a
                        className="showcase-visit"
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {host} ↗
                      </a>
                    </div>
                  </li>
                )
              })}
            </ul>

            <p className="showcase-add">
              Shipped something with cascivo?{' '}
              <a href={REPO_DATA_URL} target="_blank" rel="noopener noreferrer">
                Add your site &rarr;
              </a>
            </p>
          </section>
        </main>
      </SkipNavTarget>
      <Footer />
    </>
  )
}
