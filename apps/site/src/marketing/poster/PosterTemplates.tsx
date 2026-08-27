import { CodeSnippet } from '@cascivo/components/code-snippet'

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

export function PosterTemplates() {
  return (
    <section className="pg-section" id="templates" aria-label="Templates">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Start from a template</h2>
        <p className="pg-eyebrow">11 / marketplace</p>
      </div>
      <div className="pg-tiles pg-tiles--3">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.name} className="pg-pad pg-template">
            <p className="pg-template-name">{tpl.name}</p>
            <p className="pg-note">{tpl.value}</p>
            <CodeSnippet
              className="pg-template-install"
              variant="single"
              language="bash"
              code={tpl.install}
            />
            <a className="pg-link" href="/docs/marketplace">
              Browse the marketplace →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
