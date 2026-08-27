import { shadcnParity, themeCount } from './figures'

interface Row {
  feature: string
  cascivo: string
  shadcn: string
  /** Evidence page — the feature name links here so every claim is checkable. */
  href?: string
}

const ROWS: Row[] = [
  { feature: 'Tailwind', cascivo: 'Not required', shadcn: 'Required (v4)', href: '/docs/platform' },
  {
    feature: 'Component styling',
    cascivo: 'Design tokens + plain CSS',
    shadcn: 'Utility classes',
    href: '/modern-css',
  },
  {
    feature: 'Reactivity',
    cascivo: 'Signals — targeted DOM updates',
    shadcn: 'React state + re-render',
    href: '/performance',
  },
  {
    feature: 'Theming',
    cascivo: `3-tier tokens · ${themeCount} themes · scope any subtree`,
    shadcn: 'CSS variables + .dark class',
    href: '/create',
  },
  {
    feature: 'Prebuilt package',
    cascivo: '@cascivo/react — every component, versioned',
    shadcn: 'Copy-paste',
    href: '/docs/getting-started',
  },
  { feature: 'Internationalization', cascivo: 'Built-in (@cascivo/i18n)', shadcn: 'Not included' },
  {
    feature: 'Charts',
    cascivo: 'Zero-dependency (@cascivo/charts)',
    shadcn: 'Recharts',
    href: '/docs/charts',
  },
  { feature: 'Tests with the source', cascivo: 'Ship with each component', shadcn: 'Not included' },
  {
    feature: 'Upgrades after you edit',
    cascivo: 'Versioned registry + cascivo update',
    shadcn: 'Manual diff against main',
    href: '/docs/upgrading',
  },
  {
    feature: 'AI layer',
    cascivo: 'Per-component manifests + semantic MCP + audit',
    shadcn: 'MCP install + llms.txt',
    href: '/docs/ai',
  },
]

/**
 * A real `<table>` rather than `DataTable`: the accessibility spec requires a
 * `<caption>` and `<th scope="row">` per row, which a sortable data grid does
 * not model. It scrolls inside its own box so 320px never scrolls the page.
 */
export function PosterComparison() {
  return (
    <section className="pg-section" id="compare" aria-label="cascivo compared to shadcn/ui">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Same model, no tax</h2>
        <p className="pg-eyebrow">05 / vs shadcn/ui</p>
      </div>
      <div className="pg-pad pg-compare-pad">
        <p className="pg-body pg-compare-lede">
          Like shadcn, you own the code the CLI copies in. The difference is what it is built on —
          no Tailwind dependency, signals instead of re-renders, and a token system, i18n, charts,
          and an AI layer in the box.
        </p>
        <div className="pg-scroll" role="region" aria-label="Feature comparison" tabIndex={0}>
          <table className="pg-table">
            <caption className="visually-hidden">
              Feature-by-feature comparison of cascivo and shadcn/ui
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="pg-table-us">
                  cascivo
                </th>
                <th scope="col">shadcn/ui</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">
                    {row.href ? <a href={row.href}>{row.feature}</a> : row.feature}
                  </th>
                  <td className="pg-table-us">{row.cascivo}</td>
                  <td className="pg-table-them">{row.shadcn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pg-note pg-compare-foot">
          {shadcnParity.covered} of {shadcnParity.total} shadcn components have a cascivo equivalent
          — see the <a href="/docs/parity">parity matrix</a>. shadcn leads on ecosystem size and
          adoption today; cascivo&apos;s bet is the architecture.
        </p>
      </div>
    </section>
  )
}
