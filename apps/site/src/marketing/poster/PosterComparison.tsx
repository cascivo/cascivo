import { shadcnParity, themeCount } from './figures'

interface Row {
  feature: string
  cascivo: string
  shadcn: string
  /** Evidence page — the feature name links here so every claim is checkable. */
  href?: string
}

interface StylexRow {
  feature: string
  cascivo: string
  stylex: string
}

/**
 * StyleX is a styling system, not a component library, so it gets its own short table
 * rather than a fourth column: half the shadcn rows have no StyleX answer at all.
 *
 * Every row is checkable and none of them is a dig. StyleX's compiler buys real things —
 * atomic deduplication at Meta's scale, and a hard guarantee that a wrong token fails the
 * build. The claim here is narrower and honest: cascivo reaches the same destination
 * without asking you to install one, and the row where StyleX wins is on the page too.
 */
const STYLEX_ROWS: StylexRow[] = [
  {
    feature: 'Build step for styling',
    cascivo: 'None — CSS files',
    stylex: 'Babel plugin, required',
  },
  {
    feature: 'Cascade control',
    cascivo: 'Real @layer, seven canonical layers',
    stylex: 'Computed priority + :not(##) polyfill',
  },
  {
    feature: 'Token names',
    cascivo: '--cascivo-color-accent — stable, typeable',
    stylex: 'Hashed at build; needs an import',
  },
  {
    feature: 'Wrong token caught',
    cascivo: 'Editor lint · satisfies type · CI audit',
    stylex: 'Compiler error',
  },
  {
    feature: 'Relational styling',
    cascivo: 'Native :has()',
    stylex: 'stylex.when.* + marker elements',
  },
  { feature: 'Components included', cascivo: 'The whole library', stylex: 'None — styling only' },
  { feature: 'Styles beside markup', cascivo: 'Separate .module.css', stylex: 'Same file' },
]

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
    <section
      className="pg-section"
      id="compare"
      aria-label="cascivo compared to shadcn/ui and StyleX"
    >
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

        <h3 className="pg-display pg-display--tile">And versus StyleX</h3>
        <p className="pg-body pg-compare-lede">
          Meta&apos;s StyleX compiles JavaScript style objects into atomic CSS, and it is right
          about the destination: build-time styles, typed tokens, a predictable cascade, constraints
          tight enough that an agent cannot invent a class name. cascivo agrees with all of it and
          disagrees about the compiler — it writes the CSS, uses real <code>@layer</code>, and ships
          token names you can type from memory.
        </p>
        <div className="pg-scroll" role="region" aria-label="StyleX comparison" tabIndex={0}>
          <table className="pg-table">
            <caption className="visually-hidden">
              Feature-by-feature comparison of cascivo and StyleX
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="pg-table-us">
                  cascivo
                </th>
                <th scope="col">StyleX</th>
              </tr>
            </thead>
            <tbody>
              {STYLEX_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td className="pg-table-us">{row.cascivo}</td>
                  <td className="pg-table-them">{row.stylex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pg-note pg-compare-foot">
          The last row is StyleX&apos;s, not ours — see{' '}
          <a href="/docs/compared-to-stylex.md">the full comparison</a> for why cascivo takes that
          trade, and where StyleX is the better pick.
        </p>
      </div>
    </section>
  )
}
