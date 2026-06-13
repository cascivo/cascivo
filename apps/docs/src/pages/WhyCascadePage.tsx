// Claims 1–13 are established across v1–v12 of the roadmap. This page covers the v13
// additions: claims 14–19 (The Context Layer). Each claim links its receipt — the
// artifact that proves it is real and shipped, not just stated.

const muted = { color: 'var(--cascade-color-text-subtle)' }

const cardStyle = {
  border: '1px solid var(--cascade-color-border)',
  borderRadius: 'var(--cascade-radius-lg)',
  background: 'var(--cascade-color-surface)',
  padding: 'var(--cascade-space-5)',
}

interface Claim {
  number: number
  title: string
  substance: string
  receipt: { label: string; href: string }
}

const CLAIMS: Claim[] = [
  {
    number: 14,
    title: 'AI gets intent, not just shape',
    substance:
      'Every component ships when-to-use, when-not, anti-patterns, a11y rationale, and selection edges to its neighbours — machine-readable in context.json and browsable in the Context Explorer.',
    receipt: { label: 'Browse intent in Context Explorer', href: '/context' },
  },
  {
    number: 15,
    title: 'Closed sets, machine-readable',
    substance:
      'A generated token catalog publishes every --cascade-* custom property with its layer (primitive / semantic / component), group, and resolved default. An agent selects from this closed set; inventing a literal value is now a detectable error.',
    receipt: { label: 'tokens.catalog.json', href: '/tokens.catalog.json' },
  },
  {
    number: 16,
    title: 'AI output is audited',
    substance:
      "cascade audit --ai flags hard-coded color/spacing values (with the suggested token), invented props on known components, missing required props, and raw strings where i18n is expected — in the user's own codebase, not just in this repo. The same checkers run live in the browser on the Context Explorer page.",
    receipt: { label: 'Try audit --ai live in Context Explorer', href: '/context' },
  },
  {
    number: 17,
    title: 'Context is consolidated',
    substance:
      'One context.json joins the registry, intent blocks, design specs, boundary registry, and authoring rules into a single machine-readable bundle. Per-component context.md files give agents one URL per component. The bundle is generated — editing by hand is prevented by the drift gate.',
    receipt: { label: 'context.json (full bundle)', href: '/context.json' },
  },
  {
    number: 18,
    title: 'Logic goes CSS-native',
    substance:
      'Button, Badge, and Alert now use CSS @function token math and if(style()) variant selection, each guarded by an @supports fallback. The system works pixel-identically in Safari and Firefox; the CSS-native path is a Chrome-leading progressive enhancement. A fallback-audit script asserts no @function or if() usage is ever shipped without a guarded fallback.',
    receipt: {
      label: 'functions.css — CSS @function helpers',
      href: 'https://github.com/urbanisierung/cascade-ui/blob/main/packages/tokens/src/functions.css',
    },
  },
  {
    number: 19,
    title: 'Receipts, not adjectives',
    substance:
      'A before/after agent-generation demo on the Context Explorer page shows the measurable delta in audit-score when an agent uses the context layer versus the bare manifest. The Context Explorer itself is the live proof: intent, boundaries, specs, token catalog, and the audit checker are all browsable and verifiable in one place.',
    receipt: { label: 'Context Explorer — before/after demo', href: '/context' },
  },
]

export function WhyCascadePage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Why cascade</div>
        <h1>The claims — and the receipts</h1>
        <p class="doc-lede">
          "AI-first" is easy to say. Claims 14–19 are v13's additions to the cascade pitch. Each one
          links its receipt — the artifact that proves it shipped.
        </p>
      </header>

      <section class="doc-section">
        <p style={muted}>
          Claims 1–13 cover the core design-system properties established in v1–v12: owned
          components, CSS-native styling, signal-driven reactivity, three-level token architecture,
          WCAG 2.1 AA, open registry model, and long-run sustainability. v13 adds the context layer:
          machine-readable intent, closed-set tokens, AI-output auditing, and CSS-native logic.
        </p>
      </section>

      <section class="doc-section">
        <div style={{ display: 'grid', gap: 'var(--cascade-space-5)' }}>
          {CLAIMS.map((claim) => (
            <div key={claim.number} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 'var(--cascade-space-3)',
                  marginBlockEnd: 'var(--cascade-space-3)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--cascade-text-sm)',
                    fontWeight: 'var(--cascade-font-medium)',
                    color: 'var(--cascade-color-text-subtle)',
                    minWidth: '2.5rem',
                  }}
                >
                  #{claim.number}
                </span>
                <h2 style={{ margin: 0, fontSize: 'var(--cascade-text-lg)' }}>{claim.title}</h2>
              </div>
              <p style={{ margin: '0 0 var(--cascade-space-3)' }}>{claim.substance}</p>
              <a
                href={claim.receipt.href}
                style={{
                  fontSize: 'var(--cascade-text-sm)',
                  color: 'var(--cascade-color-accent)',
                }}
              >
                Receipt: {claim.receipt.label}
              </a>
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
