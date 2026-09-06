import { AspectRatio } from '@cascivo/components/aspect-ratio'
import { SHOWCASE, displayHost } from '../pages/showcase/data'

const REPO = 'https://github.com/cascivo/cascivo/tree/main/apps/examples'
const DOCS_REPO = 'https://github.com/cascivo/cascivo/blob/main/docs'

// Four real, shipped products; the rest are on /showcase. Screenshots are
// committed under public/showcase/<slug>.jpg and lazy-loaded — this band sits
// far below the fold, so it never weighs on LCP.
const FEATURED = SHOWCASE.slice(0, 4)

const FRAMEWORKS = [
  {
    name: 'Next.js',
    note: 'App Router / RSC — components keep their "use client" boundary.',
    href: `${REPO}/react-next`,
  },
  {
    name: 'Vite + React',
    note: 'The reference setup — themes import once, component CSS rides along.',
    href: `${REPO}/react-vite`,
  },
  {
    name: 'Astro',
    note: 'Islands server-render styled; page content ships zero JS. Scaffold one with cascivo create --framework astro.',
    // The guide, not apps/examples/astro-islands: that fixture is workspace-linked, so its
    // config omits the `vite.resolve.noExternal` line a real install requires. Pointing
    // adopters at it would hand them a config that does not work.
    href: `${DOCS_REPO}/USING-WITH-ASTRO.md`,
    linkLabel: 'Read the Astro guide ↗',
  },
  {
    name: 'Preact',
    note: 'Signals are natively reactive — no adapter, via preact/compat.',
    href: `${DOCS_REPO}/USING-WITH-PREACT.md`,
    linkLabel: 'Read the Preact guide ↗',
  },
]

export function PosterShowcase() {
  return (
    <section className="pg-section" id="showcase" aria-label="In the wild">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Shipped, in production</h2>
        <p className="pg-eyebrow">12 / in the wild</p>
      </div>

      <ul className="pg-tiles pg-tiles--4 pg-showcase">
        {FEATURED.map((site) => (
          <li key={site.slug} className="pg-showcase-item">
            <a
              className="pg-showcase-link"
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AspectRatio className="pg-showcase-shot" ratio={16 / 10}>
                {/* A plain <img>: `Image` has no `@cascivo/components/image`
                    subpath export, and none of what it adds (fallbackSrc, zoom,
                    radius) is wanted inside a fixed-ratio poster tile. */}
                <img
                  src={`/showcase/${site.slug}.jpg`}
                  alt={`Screenshot of ${site.name}`}
                  width={1280}
                  height={800}
                  loading="lazy"
                  decoding="async"
                />
              </AspectRatio>
              <span className="pg-pad pg-showcase-meta">
                <span className="pg-display pg-display--sub">{site.name}</span>
                <span className="pg-showcase-cat pg-mono">{site.category}</span>
                <span className="pg-showcase-host">{displayHost(site.url)} ↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <ul className="pg-tiles pg-tiles--4 pg-frameworks">
        {FRAMEWORKS.map((fw) => (
          <li key={fw.name} className="pg-pad pg-framework">
            <p className="pg-display pg-display--sub">{fw.name}</p>
            <p className="pg-note">{fw.note}</p>
            <a className="pg-link" href={fw.href} target="_blank" rel="noopener noreferrer">
              {fw.linkLabel ?? 'See the example ↗'}
            </a>
          </li>
        ))}
      </ul>

      <p className="pg-pad pg-note pg-frameworks-aside">
        Not a React app? <code>@cascivo/tokens</code> and <code>@cascivo/themes</code> are
        framework-agnostic CSS — the colour system, type scale and twelve themes work anywhere,
        components or not. There&apos;s a{' '}
        <a href={`${DOCS_REPO}/USING-WITH-GHOST.md`} target="_blank" rel="noopener noreferrer">
          Ghost (Handlebars) theme
        </a>{' '}
        built entirely on them.
      </p>

      <p className="pg-pad pg-note pg-showcase-more">
        <a href="/showcase">See all {SHOWCASE.length} products built with cascivo →</a>
      </p>
    </section>
  )
}
