const REPO = 'https://github.com/cascivo/cascivo'

const TEMPLATES = [
  {
    name: '@cascivo/dashboard',
    value:
      'An analytics dashboard — KPI cards, a chart slot, and a recent-activity table. Composes card, badge, and data-table.',
    install: 'npx cascivo add @cascivo/dashboard',
  },
  {
    name: '@cascivo/auth',
    value:
      'A centered sign-in screen with email and password fields. Composes card, input, and button.',
    install: 'npx cascivo add @cascivo/auth',
  },
  {
    name: '@cascivo/landing',
    value:
      'A marketing landing page — hero, feature grid, and a call to action. Composes button, card, and badge.',
    install: 'npx cascivo add @cascivo/landing',
  },
]

/**
 * Marketing teaser for the templates marketplace: whole-page compositions you
 * install and own, hosted on GitHub with no backend. Links to the gallery and
 * the contributor guide.
 */
export function Templates() {
  return (
    <section id="templates" className="ecosystem section" data-reveal>
      <h2>Start from a template, not a blank file</h2>
      <p className="ecosystem-sub section-sub">
        Templates are whole-page compositions — a working page, the components it uses, and its
        fixtures — that you install and <strong>own</strong>. Community-contributed, hosted on
        GitHub, no backend. Install one with <code>cascivo add</code> and adapt it.
      </p>
      <div className="ecosystem-grid">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.name} className="ecosystem-card">
            <p className="ecosystem-pkg">{tpl.name}</p>
            <p className="ecosystem-value">{tpl.value}</p>
            <pre className="ecosystem-install">
              <code>{tpl.install}</code>
            </pre>
            <a className="ecosystem-link" href="/docs/marketplace">
              Browse the marketplace &rarr;
            </a>
          </div>
        ))}
      </div>
      <p
        className="ecosystem-sub section-sub"
        style={{ marginBlockStart: 'var(--cascivo-space-5)' }}
      >
        Want to publish your own?{' '}
        <a
          className="ecosystem-link"
          href={`${REPO}/blob/main/docs/CONTRIBUTING-TEMPLATES.md`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contribute a template &rarr;
        </a>
      </p>
    </section>
  )
}
