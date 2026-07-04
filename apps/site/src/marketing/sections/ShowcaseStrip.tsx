import { SHOWCASE, displayHost } from '../pages/showcase/data'

// A compact home teaser for the full /showcase page: the first six real, shipped
// products. Deliberately below the fold and lazy-loaded — screenshots never
// weigh on LCP. No fabricated logos or testimonials; every card links to a live
// product you can open.
const FEATURED = SHOWCASE.slice(0, 6)

export function ShowcaseStrip() {
  return (
    <section
      className="section showcase-strip"
      id="showcase-strip"
      aria-label="Products built with cascivo"
      data-reveal=""
    >
      <div className="flow-header">
        <p className="flow-eyebrow">In the wild</p>
        <h2 className="flow-title">Real products, shipped with cascivo</h2>
      </div>
      <p className="section-sub">
        Not demos — live products in production, from a one-tap payment link to a BPMN SDK and a
        local-first backup platform. Open any of them.
      </p>

      <ul className="showcase-strip-grid">
        {FEATURED.map((site) => {
          const host = displayHost(site.url)
          return (
            <li key={site.slug} className="showcase-strip-card">
              <a
                className="showcase-strip-link"
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${site.name} (${site.category})`}
              >
                <span className="showcase-strip-shot">
                  <img
                    src={`/showcase/${site.slug}.jpg`}
                    alt={`Screenshot of ${site.name}`}
                    width={1280}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </span>
                <span className="showcase-strip-meta">
                  <span className="showcase-strip-name">{site.name}</span>
                  <span className="showcase-strip-cat">{site.category}</span>
                </span>
                <span className="showcase-strip-host" aria-hidden="true">
                  {host} ↗
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <p className="showcase-strip-more">
        <a href="/showcase">See all {SHOWCASE.length} products built with cascivo →</a>
      </p>
    </section>
  )
}
