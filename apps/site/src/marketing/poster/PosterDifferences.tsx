import { partial, themeCount } from './figures'

interface Difference {
  title: string
  body: string
  tag: string
  href: string
}

// Five columns, each ending in a mono tag on a hairline — the receipt for the
// claim above it. Every tag links to the page that proves it.
const DIFFERENCES: Difference[] = [
  {
    title: 'Platform CSS',
    body: '@layer, @container, :has(), custom properties. No utility classes, no runtime style injection.',
    tag: 'zero runtime',
    href: '/modern-css',
  },
  {
    title: 'Signal-driven',
    body: "Signals write state past React's reconciler. A component re-renders only on its own data.",
    tag: partial ? `${partial.speedup.toFixed(1)}× updates` : 'targeted updates',
    href: '/performance',
  },
  {
    title: 'Themes built in',
    body: `${themeCount} first-party themes over three-level tokens. Scope any theme to any subtree.`,
    tag: 'one token swap',
    href: '/create',
  },
  {
    title: 'Owned code',
    body: 'The CLI copies the source into your repo. A versioned registry keeps upgrades possible after you edit.',
    tag: 'cascivo update',
    href: '/docs/upgrading',
  },
  {
    title: 'AI-first',
    body: 'A manifest per component, an MCP server, and an audit that checks what your agent wrote.',
    tag: 'mcp · llms.txt',
    href: '/ai',
  },
]

export function PosterDifferences() {
  return (
    <section className="pg-section" id="why" aria-label="Why cascivo">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Five differences</h2>
        <p className="pg-eyebrow">02 / why cascivo</p>
      </div>
      <div className="pg-tiles pg-tiles--5">
        {DIFFERENCES.map((d, i) => (
          <div key={d.title} className="pg-pad pg-diff">
            <p className="pg-diff-num">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="pg-display pg-display--tile">{d.title}</h3>
            <p className="pg-body">{d.body}</p>
            <a className="pg-diff-tag" href={d.href}>
              {d.tag}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
