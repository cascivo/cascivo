// Claims 1–13 are established across v1–v12 of the roadmap. Claims 14–19 cover v13
// (The Context Layer). Claims 20–24 cover v14 (Earned Quality). Each claim links its
// receipt — the artifact that proves it is real and shipped, not just stated.

const muted = { color: 'var(--cascivo-color-text-subtle)' }

const cardStyle = {
  border: '1px solid var(--cascivo-color-border)',
  borderRadius: 'var(--cascivo-radius-lg)',
  background: 'var(--cascivo-color-surface)',
  padding: 'var(--cascivo-space-5)',
}

interface Claim {
  number: number
  title: string
  substance: string
  receipt: { label: string; href: string } | null
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
      'A generated token catalog publishes every --cascivo-* custom property with its layer (primitive / semantic / component), group, and resolved default. An agent selects from this closed set; inventing a literal value is now a detectable error.',
    receipt: { label: 'tokens.catalog.json', href: '/tokens.catalog.json' },
  },
  {
    number: 16,
    title: 'AI output is audited',
    substance:
      "cascivo audit --ai flags hard-coded color/spacing values (with the suggested token), invented props on known components, missing required props, and raw strings where i18n is expected — in the user's own codebase, not just in this repo. The same checkers run live in the browser on the Context Explorer page.",
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
      href: 'https://github.com/urbanisierung/cascivo/blob/main/packages/tokens/src/functions.css',
    },
  },
  {
    number: 19,
    title: 'Receipts, not adjectives',
    substance:
      'A before/after agent-generation demo on the Context Explorer page shows the measurable delta in audit-score when an agent uses the context layer versus the bare manifest. The Context Explorer itself is the live proof: intent, boundaries, specs, token catalog, and the audit checker are all browsable and verifiable in one place.',
    receipt: { label: 'Context Explorer — before/after demo', href: '/context' },
  },
  {
    number: 20,
    title: 'Per-theme CVD-safe chart palettes',
    substance:
      'All 8 chart colors are distinguishable under protanopia, deuteranopia, and tritanopia across all 10 themes. Palettes are rooted in Okabe-Ito oklch coordinates, overridden per theme, and verified by a CI palette test that checks presence, contrast, and CVD simulation on every merge.',
    receipt: {
      label: 'Themed chart gallery in docs',
      href: '/charts',
    },
  },
  {
    number: 21,
    title: 'Accessible chart tooltips',
    substance:
      'Every chart tooltip supports keyboard traversal (Arrow keys move between data points) and screen-reader aria-live announcement. The behavior is implemented in ChartFrame and rolled out to all 17 chart types. A keyboard tooltip demo in docs lets you verify it interactively.',
    receipt: { label: 'Keyboard tooltip demo', href: '/charts' },
  },
  {
    number: 22,
    title: 'Honest multi-lens performance data',
    substance:
      'The performance page presents standalone, incremental, and amortized cost views side by side, with explained zeros and per-architecture copy. No cherry-picked numbers — the methodology is documented and the runner is open source.',
    receipt: {
      label: 'Performance page',
      href: '/performance',
    },
  },
  {
    number: 23,
    title: 'WCAG 2.2 AA + APG-conformant',
    substance:
      '72 components are verified at WCAG 2.2-AA. CI enforces APG pattern checks — role, keyboard interaction, and required ARIA attributes — on every merge. No self-reported claims: the check is a test that fails the build.',
    receipt: { label: 'Accessibility page', href: '/accessibility' },
  },
  {
    number: 24,
    title: 'AT-tested + legally mapped',
    substance:
      'A representative assistive-technology matrix (NVDA, JAWS, VoiceOver) documents tested components, OS/AT combos, and any known gaps. An EAA / EN 301 549 / Section 508 legal mapping traces each standard to the cascivo artifact that satisfies it. Both are browsable in the docs accessibility section.',
    receipt: { label: 'Accessibility statement', href: '/accessibility' },
  },
  {
    number: 25,
    title: 'One coherent brand — cascivo',
    substance:
      'Single name across every package (@cascivo/*), token (--cascivo-*), CLI (cascivo), registry URL, and domain (cascivo.com). Derivation documented; logo + brand color system shipped.',
    receipt: { label: 'Brand page', href: '/brand' },
  },
  {
    number: 26,
    title: 'The landing is flawless on a phone',
    substance:
      'Mobile-first rebuild, zero horizontal overflow at 320/375/390/414px. Off-canvas nav with focus trap. Fluid type via clamp(). Heavy demos (RelayConsole, charts, SignalsDemo) get deliberate mobile treatments, not blind shrinks.',
    receipt: null,
  },
  {
    number: 27,
    title: 'The docs match it',
    substance:
      'Mobile-first docs: AppShell off-canvas nav, fluid type, responsive tables (stacked cards), code blocks sized for narrow screens, container-query sections. Full parity with the landing.',
    receipt: null,
  },
  {
    number: 28,
    title: 'Complete story, accurate numbers',
    substance:
      'Every major shipped feature — charts, layouts, i18n, AI audit, RSC support — is visible on ' +
      'the landing page. WCAG 2.2 AA, 10 themes, and correct CLI commands are stated accurately. ' +
      'No stale claims, no missing receipts.',
    receipt: null,
  },
  {
    number: 29,
    title: 'Charts built for every user and condition',
    substance:
      '17 chart types. CVD-safe palettes across all 10 themes — rooted in Okabe-Ito oklch and ' +
      'verified under protanopia, deuteranopia, and tritanopia. Keyboard-navigable tooltips on ' +
      'every chart type. Dogfooded in our own docs.',
    receipt: { label: 'See the chart gallery', href: '/charts' },
  },
  {
    number: 30,
    title: 'AI audit closes the loop',
    substance:
      'cascivo audit --ai scans agent-generated code for hard-coded color values (with token ' +
      'suggestions), invented props on known components, missing required props, and raw strings ' +
      'where the i18n catalog expects a key. The agent builds with the manifest; the audit checks ' +
      'what it produced.',
    receipt: { label: 'Context Explorer — try audit --ai live', href: '/context' },
  },
  {
    number: 31,
    title: 'A real migration path, not a wall',
    substance:
      'A step-by-step guide for switching from shadcn/ui: what transfers for free (the copy-own ' +
      'model, accessible primitives, your app structure) and what changes (signals, three-tier ' +
      'tokens, data-theme), with honest bundle and accessibility deltas read from live bench data.',
    receipt: { label: 'Coming from shadcn? See the guide', href: '/guides#migrate' },
  },
  {
    number: 32,
    title: 'Brand it without forking the system',
    substance:
      'Three-tier token overrides — primitive, semantic, component — let you rebrand in one line, ' +
      'brand a single component, or scope a whole theme to any subtree with data-theme. For a full ' +
      'brand theme, the create-theme skill and the create_theme MCP tool generate one from a color.',
    receipt: { label: 'Make it yours — the customization guide', href: '/guides#customize' },
  },
  {
    number: 33,
    title: 'Honest about fit',
    substance:
      'Use-case scenarios that say where cascivo wins — AI-driven UI, multi-brand, performance, ' +
      'accessibility, ownership — and a "when not to use" section that says where it does not: ' +
      'Chrome-leading CSS pilots, alpha tooling, React/Preact-only, modern browsers. Candor, not adjectives.',
    receipt: { label: 'Use cases & honest boundaries', href: '/guides#use-cases' },
  },
  {
    number: 34,
    title: 'Primitives, not just components',
    substance:
      '@cascivo/core ships the composition substrate shadcn gets from Radix — Slot/asChild, ' +
      'useControllableSignal, DismissableLayer, RovingFocus, Presence, anchor positioning — all ' +
      'signal-driven with zero useState/useEffect/useContext. Components are built on the primitives, ' +
      'not around their absence.',
    receipt: {
      label: '@cascivo/core primitives',
      href: 'https://github.com/urbanisierung/cascivo/tree/main/packages/core/src',
    },
  },
  {
    number: 35,
    title: 'Measured parity, not implied',
    substance:
      'A generated matrix scores cascivo against shadcn/ui (59) and IBM Carbon (47) component by ' +
      'component. The coverage page renders from parity.json, whose numbers are derived and ' +
      'cross-checked against the real @cascivo/react exports — it cannot overstate. Where there is a ' +
      'gap, there is a dated, queued spec.',
    receipt: { label: 'Parity coverage page', href: '/parity' },
  },
  {
    number: 36,
    title: 'The catalog keeps closing the gap',
    substance:
      'Every parity gap is a real factory-backlog.json entry; the dark factory builds them on the v18 ' +
      'primitives. v18 shipped 29 of them — the Tier-1 a11y substrate (Label, Field, Button Group, ' +
      'Toggle Group, Icon Button, Inline Loading, Notification, Scroll Area, Collapsible, Aspect Ratio) ' +
      'and the Tier-2 structural set (Navigation Menu, Menubar, Menu Button, Toggletip, Resizable, ' +
      'Drawer, Tree View, Tile, Structured List, Contained List, Carousel, Calendar, Date Range Picker, ' +
      'Color Picker, Timeline, Data List, Native Select, Item, Code Snippet).',
    receipt: { label: 'See the coverage page', href: '/parity' },
  },
]

export function WhyCascadePage() {
  return (
    <article class="doc-page">
      <header class="doc-head">
        <div class="doc-eyebrow">Why cascivo</div>
        <h1>The claims — and the receipts</h1>
        <p class="doc-lede">
          "AI-first" is easy to say. Claims 14–36 are v13–v18's additions to the cascivo pitch. Each
          one links its receipt — the artifact that proves it shipped.
        </p>
      </header>

      <section class="doc-section">
        <p style={muted}>
          Claims 1–13 cover the core design-system properties established in v1–v12: owned
          components, CSS-native styling, signal-driven reactivity, three-level token architecture,
          WCAG 2.1 AA, open registry model, and long-run sustainability. v13 adds the context layer:
          machine-readable intent, closed-set tokens, AI-output auditing, and CSS-native logic. v14
          adds earned quality: CVD-safe chart palettes, accessible chart tooltips, honest multi-lens
          performance data, WCAG 2.2 AA + APG conformance, and AT testing with legal mapping. v15
          adds brand + mobile: one coherent cascivo identity and a flawless mobile front door.
        </p>
      </section>

      <section class="doc-section">
        <div style={{ display: 'grid', gap: 'var(--cascivo-space-5)' }}>
          {CLAIMS.map((claim) => (
            <div key={claim.number} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 'var(--cascivo-space-3)',
                  marginBlockEnd: 'var(--cascivo-space-3)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--cascivo-text-sm)',
                    fontWeight: 'var(--cascivo-font-medium)',
                    color: 'var(--cascivo-color-text-subtle)',
                    minWidth: '2.5rem',
                  }}
                >
                  #{claim.number}
                </span>
                <h2 style={{ margin: 0, fontSize: 'var(--cascivo-text-lg)' }}>{claim.title}</h2>
              </div>
              <p style={{ margin: claim.receipt ? '0 0 var(--cascivo-space-3)' : '0' }}>
                {claim.substance}
              </p>
              {claim.receipt && (
                <a
                  href={claim.receipt.href}
                  style={{
                    fontSize: 'var(--cascivo-text-sm)',
                    color: 'var(--cascivo-color-accent)',
                  }}
                >
                  Receipt: {claim.receipt.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
