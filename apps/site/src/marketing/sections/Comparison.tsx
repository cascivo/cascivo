import parity from '../../../public/parity.json'

// Live parity numbers (generated into public/parity.json by scripts/parity).
const shadcnParity = (parity as { competitors: { shadcn: { total: number; covered: number } } })
  .competitors.shadcn

interface Row {
  feature: string
  cascivo: string
  shadcn: string
  /** Evidence page — the feature name links here so every claim is checkable. */
  href?: string
}

// Every row is a checkable, factual difference — no adjectives, no ownership
// claims (both let you own code). Ordered strongest-first. Each feature links to
// the page that proves it.
const ROWS: Row[] = [
  {
    feature: 'Tailwind',
    cascivo: 'Not required',
    shadcn: 'Required (v4)',
    href: '/docs/platform',
  },
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
    cascivo: '3-tier tokens · 12 themes · scope any subtree',
    shadcn: 'CSS variables + .dark class',
    href: '/create',
  },
  {
    feature: 'Prebuilt package',
    cascivo: '@cascivo/react — every component, versioned',
    shadcn: 'Copy-paste (headless @shadcn/react for chat)',
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

export function Comparison() {
  return (
    <section className="section compare" id="compare" aria-label="cascivo compared to shadcn/ui">
      <div className="flow-header">
        <p className="flow-eyebrow">vs shadcn/ui</p>
        <h2 className="flow-title">The same model, without the tax</h2>
      </div>
      <p className="section-sub">
        Like shadcn, you own the code the CLI copies in. The difference is what it's built on — no
        Tailwind dependency, signals instead of re-renders, and a token system, i18n, charts, and an
        AI layer in the box. Follow any row to the page that proves it.
      </p>

      <div className="compare-scroll" role="region" aria-label="Feature comparison" tabIndex={0}>
        <table className="compare-table">
          <caption className="visually-hidden">
            Feature-by-feature comparison of cascivo and shadcn/ui
          </caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col" className="compare-col-us">
                cascivo
              </th>
              <th scope="col">shadcn/ui</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.feature}>
                <th scope="row">
                  {row.href ? (
                    <a className="compare-feature-link" href={row.href}>
                      {row.feature}
                    </a>
                  ) : (
                    row.feature
                  )}
                </th>
                <td className="compare-col-us">{row.cascivo}</td>
                <td>{row.shadcn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="compare-foot">
        {shadcnParity.covered} of {shadcnParity.total} shadcn components have a cascivo equivalent —
        see the <a href="/docs/parity">parity matrix</a>. shadcn leads on ecosystem size and
        adoption today; cascivo's bet is the architecture. <a href="/docs/why">Why cascivo →</a> ·{' '}
        <a href="/guides#migrate">Migrating from shadcn →</a>
      </p>
    </section>
  )
}
