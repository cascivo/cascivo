import { CodeSnippet } from '@cascivo/components/code-snippet'

const REPO = 'https://github.com/cascivo/cascivo/tree/main/templates'

const TEMPLATES = [
  {
    name: '@cascivo/dashboard',
    slug: 'dashboard',
    value:
      'An analytics dashboard — KPI cards, a chart slot, and a recent-activity table. Composes card, badge, and data-table.',
    install: 'npx cascivo add @cascivo/dashboard',
  },
  {
    name: '@cascivo/auth',
    slug: 'auth',
    value:
      'A centered sign-in screen with email and password fields. Composes card, input, and button.',
    install: 'npx cascivo add @cascivo/auth',
  },
  {
    name: '@cascivo/landing',
    slug: 'landing',
    value:
      'A marketing landing page — hero, feature grid, and a call to action. Composes button, card, and badge.',
    install: 'npx cascivo add @cascivo/landing',
  },
]

/**
 * Each card used to close on the same "browse the marketplace" link, so the row
 * read as three copies of one CTA rather than three templates. The marketplace
 * link belongs to the section and appears once, in its footer; the cards point at
 * their own source.
 */
export function PosterTemplates() {
  return (
    <section className="pg-section" id="templates" aria-label="Templates">
      <div className="pg-pad pg-head">
        <h2 className="pg-display pg-display--section">Start from a template</h2>
        <p className="pg-eyebrow">13 / marketplace</p>
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
            <a
              className="pg-link"
              href={`${REPO}/${tpl.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source ↗
            </a>
          </div>
        ))}
      </div>
      <p className="pg-pad pg-note pg-template-foot">
        <span className="pg-mono">
          {TEMPLATES.length} templates · MIT · <code>cascivo update</code> keeps them upgradable
        </span>
        <a className="pg-link" href="/docs/marketplace">
          Browse the marketplace →
        </a>
      </p>
    </section>
  )
}
