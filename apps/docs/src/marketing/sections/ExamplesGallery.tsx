import { useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { DEMOS } from '../pages/examples/data'

export function ExamplesGallery() {
  useSignals()
  const activeIdx = useSignal(0)

  useSignalEffect(() => {
    const id = setInterval(() => {
      activeIdx.value = (activeIdx.value + 1) % DEMOS.length
    }, 4000)
    return () => clearInterval(id)
  })

  const demo = DEMOS[activeIdx.value]
  if (!demo) return null

  const prev = () => {
    activeIdx.value = (activeIdx.value - 1 + DEMOS.length) % DEMOS.length
  }
  const next = () => {
    activeIdx.value = (activeIdx.value + 1) % DEMOS.length
  }

  return (
    <section id="examples" className="section examples-gallery" data-reveal>
      <h2>Drive it, don&rsquo;t read about it.</h2>
      <p className="section-sub examples-gallery-sub">
        Five functional mock dashboards, each modelled on a well-known SaaS product. No backend, no
        accounts, no setup — open the URL and play. Collectively they exercise every component and
        every chart in the library.
      </p>

      <div className="examples-carousel">
        <div className="examples-screenshot-frame">
          <img
            src={demo.screenshots.desktopLight}
            alt={`${demo.name} dashboard screenshot`}
            className="examples-screenshot"
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="examples-carousel-info">
          <div className="examples-card-header">
            <span className="examples-name">{demo.name}</span>
            <span className="examples-feels-like">feels like {demo.feelsLike}</span>
          </div>
          <p className="examples-desc examples-desc--long">{demo.description}</p>
          <ul className="examples-chips" aria-label="Featured components">
            {demo.coverage.map((chip) => (
              <li key={chip} className="examples-chip">
                {chip}
              </li>
            ))}
          </ul>
          <div className="examples-card-footer">
            <a className="examples-link" href={demo.detailHref}>
              View demo &rarr;
            </a>
            <span className="examples-mock-note">Mock demo &mdash; no real data</span>
          </div>
        </div>

        <div className="examples-nav">
          <button
            type="button"
            className="examples-nav-btn"
            aria-label="Previous demo"
            onClick={prev}
          >
            &#8592;
          </button>
          <div className="examples-dots" role="group" aria-label="Select demo">
            {DEMOS.map((d, i) => (
              <button
                key={d.slug}
                type="button"
                className="examples-dot"
                aria-label={d.name}
                aria-pressed={activeIdx.value === i}
                data-state={activeIdx.value === i ? 'active' : undefined}
                onClick={() => {
                  activeIdx.value = i
                }}
              />
            ))}
          </div>
          <button type="button" className="examples-nav-btn" aria-label="Next demo" onClick={next}>
            &#8594;
          </button>
        </div>
      </div>

      <p className="examples-gallery-all">
        <a className="examples-link" href="/examples">
          See all five demos &rarr;
        </a>
      </p>
    </section>
  )
}
