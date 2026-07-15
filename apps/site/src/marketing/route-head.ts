// Single source of truth for per-route <head> metadata. Consumed by:
//   - App.tsx       — route titles + runtime head application
//   - seo.ts        — runtime head application (applyRouteSeo)
//   - vite.config.ts — build-time prerender of per-route static HTML (T3)
// Import-free on purpose (no registry/document) so the Vite config can import it
// safely. `/og` is intentionally absent — it's a render target, not a page.

export const SITE_URL = 'https://cascivo.com'

export type RouteHead = {
  title: string
  /** Unique meta/og/twitter description for the route. */
  description: string
  /** Optional og/twitter title override (defaults to `title`). */
  ogTitle?: string
  /** Absolute-from-root path to a per-route social card (defaults to /og.png). */
  ogImage?: string
}

export const ROUTE_HEAD: Record<string, RouteHead> = {
  '/': {
    title: 'cascivo — the CSS-native, signal-driven, AI-first React design system',
    description:
      // Count literal (not the injected global): this module is also imported by
      // scripts/sitemap/generate.ts under plain Node. claims:check guards drift.
      'cascivo is the CSS-native, signal-driven, AI-first React design system: owned-code React components, 12 themes, an MCP server, and WCAG 2.2 AA — plus six functional example dashboards you can open and play with today.',
    ogTitle: 'cascivo',
  },
  '/accessibility': {
    title: 'Accessibility — cascivo',
    description:
      'How cascivo meets WCAG 2.2 AA: zero axe violations in the automated axe suite, keyboard and screen-reader support, and a representative assistive-technology test plan.',
  },
  '/performance': {
    title: 'Performance — cascivo',
    description:
      'cascivo performance: signal-driven fine-grained updates, per-component CSS, and measured benchmarks against popular React UI libraries — fewer re-renders, smaller bundles.',
    ogImage: '/og/performance.png',
  },
  '/charts': {
    title: 'Charts — cascivo',
    description:
      '18 chart types built from scratch in @cascivo/charts: line, area, bar, pie, scatter, bubble, combo, radar, heatmap, treemap, histogram, boxplot, sparkline, KPI, meter, bullet, radial-bar and funnel. Annotations, value labels, percent stacking, and click-to-drill — keyboard-navigable, theme-aware, and CVD-safe with zero runtime dependencies.',
    ogTitle: 'cascivo charts — 18 types, CVD-safe, keyboard-first',
    ogImage: '/og/charts.png',
  },
  '/guides': {
    title: 'Guides — cascivo',
    description:
      'Guides for adopting cascivo: migrating from shadcn, brand customization, real use-case scenarios, and an honest take on when not to use it.',
  },
  '/blog': {
    title: 'Blog — cascivo',
    description:
      'Notes on building cascivo: the AI layer, signal-driven reactivity, modern CSS, and what shipping an owned-code design system actually looks like.',
  },
  '/guides/coming-from-shadcn': {
    title: 'Coming from shadcn/ui? — cascivo',
    description:
      'What transfers for free and what changes when you move from shadcn/ui to cascivo, a step-by-step migration path, and an honest verdict — with live bundle-size and accessibility deltas.',
    ogTitle: 'Coming from shadcn/ui?',
  },
  '/guides/customization': {
    title: 'Make it yours — theming cascivo — cascivo',
    description:
      'Branding cascivo with the three-tier token system: rebrand in one CSS line, brand a single component, or theme any subtree with data-theme — no fork, no config file.',
    ogTitle: 'Make it yours',
  },
  '/guides/use-cases': {
    title: 'When is cascivo the right call? — cascivo',
    description:
      'Five scenarios where cascivo earns its place — AI-driven UI, multi-brand products, performance, accessibility, and component ownership — each mapped to the receipt that proves it.',
    ogTitle: 'When is cascivo the right call?',
  },
  '/guides/when-not-to-use': {
    title: 'When not to use cascivo — cascivo',
    description:
      'An honest list of where cascivo is the wrong tool or only a forward bet: Chrome-leading CSS pilots, alpha tooling, React/Preact only, and modern-browsers-only support.',
    ogTitle: 'When not to use cascivo',
  },
  '/guides/faq': {
    title: 'Questions before you adopt cascivo — cascivo',
    description:
      'The questions people ask before committing to cascivo — licensing, adopting one component at a time, Next.js/RSC, Tailwind, and how it compares to shadcn/ui.',
    ogTitle: 'Questions before you adopt cascivo',
  },
  '/enterprise': {
    title: 'Enterprise-ready & AI-first — cascivo',
    description:
      'Why cascivo is safe to bet a product on: you own the copy-pasted source, WCAG 2.2 AA accessibility, signal performance under load, a first-party platform (state, forms, theming, i18n, charts), and an AI-first machine-readable core that keeps quality high whether a human or an agent writes the code.',
    ogTitle: 'cascivo — enterprise-ready & AI-first',
  },
  '/modern-css': {
    title: 'Modern CSS — cascivo',
    description:
      'Why cascivo uses modern CSS: @layer for cascade control without specificity wars, @container for components that respond to their slot, and :has() for conditional styling without JavaScript.',
    ogTitle: 'Modern CSS — cascivo',
  },
  '/highlights': {
    title: 'Highlights — Flow, Editor & Icons — cascivo',
    description:
      'The newest cascivo surfaces: @cascivo/flow for signal-driven node/edge diagrams with pan, zoom and animated edges; @cascivo/editor, a CSS-native code editor with an owned tokenizer; and ~440 tree-shakeable icons. Try them live.',
    ogTitle: 'cascivo highlights — Flow, Editor & Icons',
  },
  '/examples': {
    title: 'Examples — cascivo',
    description:
      'Six functional example dashboards built with cascivo — each modelled on a well-known SaaS product (Vercel, Stripe, Camunda, Linear, Datadog, Trade Republic). Open one and play: no backend, no accounts, no setup.',
    ogTitle: 'cascivo examples',
    ogImage: '/og/examples.png',
  },
  '/examples/deploy': {
    title: 'Cascade Deploy — a Vercel-shaped demo built with cascivo',
    description:
      'Cascade Deploy: a deployments dashboard in the shape of Vercel, built with cascivo. App shell, DataTable, command menu, and a live build simulation — open it and drive it, no backend.',
    ogTitle: 'Cascade Deploy — cascivo example',
  },
  '/examples/pay': {
    title: 'Cascade Pay — a Stripe-shaped demo built with cascivo',
    description:
      'Cascade Pay: a payments dashboard in the shape of Stripe, built with cascivo. Revenue charts, a filterable transactions table, and an optimistic refund that persists across reload — no backend.',
    ogTitle: 'Cascade Pay — cascivo example',
  },
  '/examples/flow': {
    title: 'Cascade Flow — a Camunda-shaped demo built with cascivo',
    description:
      'Cascade Flow: a process-orchestration console in the shape of Camunda, built with cascivo. A live process diagram, task queue, Timeline and TreeView — a faithful visual without a BPMN engine.',
    ogTitle: 'Cascade Flow — cascivo example',
  },
  '/examples/track': {
    title: 'Cascade Track — a Linear-shaped demo built with cascivo',
    description:
      'Cascade Track: an issue tracker in the shape of Linear, built with cascivo. A keyboard-first board and backlog with Cmd+K command menu and storage-persisted mutations — no backend.',
    ogTitle: 'Cascade Track — cascivo example',
  },
  '/examples/pulse': {
    title: 'Cascade Pulse — a Datadog-shaped demo built with cascivo',
    description:
      'Cascade Pulse: an observability dashboard in the shape of Datadog, built with cascivo. Live metrics, a heatmap, alerts and a log stream driven by a real-time simulation — no backend.',
    ogTitle: 'Cascade Pulse — cascivo example',
  },
  '/showcase': {
    title: 'Showcase — products built with cascivo',
    description:
      'Nine real, shipped products built with the cascivo design system — Pagome (SEPA payment links), BPMN Kit (a BPMN diagram SDK), the Weeklyfoo Directory, u11g, Sharu, AI & me, kaihuman, Lumen & Logic, and Beleggo — proof the library holds up in production.',
    ogTitle: 'Built with cascivo',
  },
  '/ai': {
    title: 'AI layer — cascivo',
    description:
      'cascivo is AI-first: every component ships a machine-readable manifest that powers an MCP server, Claude Code skills, and llms.txt. Connect the MCP server, let your agent read every manifest, build real UI, and audit it with cascivo audit --ai.',
    ogTitle: 'cascivo AI layer',
    ogImage: '/og/ai.png',
  },
  '/create': {
    title: 'Create a theme — cascivo',
    description:
      'Design your cascivo theme in seconds: pick an accent colour, border radius, and font — see real components update live, then copy the CSS.',
    ogTitle: 'cascivo theme configurator',
    ogImage: '/og/create.png',
  },
  '/blocks': {
    title: 'Blocks — cascivo',
    description:
      'Production-ready UI sections built with cascivo components. Browse auth flows, dashboards, marketing sections, and app shells — then copy the source in one click.',
    ogTitle: 'cascivo blocks',
  },
}

/** Routes that get prerendered + listed in the sitemap (excludes `/` root and `/og`). */
export const PRERENDER_ROUTES = [
  'accessibility',
  'performance',
  'enterprise',
  'guides',
  'guides/coming-from-shadcn',
  'guides/customization',
  'guides/use-cases',
  'guides/when-not-to-use',
  'guides/faq',
  'modern-css',
  'highlights',
  'examples',
  'showcase',
  'examples/deploy',
  'examples/pay',
  'examples/flow',
  'examples/track',
  'examples/pulse',
  'ai',
  'charts',
  'create',
  'blocks',
] as const

export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}
