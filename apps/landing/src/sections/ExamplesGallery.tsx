import { DEMOS } from '../pages/examples/data'

export function ExamplesGallery() {
  return (
    <section id="examples" className="section examples-gallery" data-reveal>
      <h2>Drive it, don&rsquo;t read about it.</h2>
      <p className="section-sub examples-gallery-sub">
        Five functional mock dashboards, each modelled on a well-known SaaS product. No backend, no
        accounts, no setup — open the URL and play. Collectively they exercise every component and
        every chart in the library.
      </p>
      <div className="examples-grid">
        {DEMOS.map((ex) => (
          <div key={ex.slug} className="examples-card">
            <div className="examples-card-header">
              <span className="examples-name">{ex.name}</span>
              <span className="examples-feels-like">feels like {ex.feelsLike}</span>
            </div>
            <p className="examples-desc">{ex.tagline}</p>
            <ul className="examples-chips" aria-label="Featured components">
              {ex.coverage.map((chip) => (
                <li key={chip} className="examples-chip">
                  {chip}
                </li>
              ))}
            </ul>
            <div className="examples-card-footer">
              <a className="examples-link" href={ex.detailHref}>
                View demo &rarr;
              </a>
              <span className="examples-mock-note">Mock demo &mdash; no real data</span>
            </div>
          </div>
        ))}
      </div>
      <p className="examples-gallery-all">
        <a className="examples-link" href="/examples">
          See all five demos &rarr;
        </a>
      </p>
    </section>
  )
}
