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
}

export const ROUTE_HEAD: Record<string, RouteHead> = {
  '/': {
    title: 'cascivo — the CSS-native, signal-driven, AI-first React design system',
    description:
      'cascivo is the CSS-native, signal-driven, AI-first React design system: owned-code React components, 12 themes, an MCP server, and WCAG 2.2 AA — plus five functional example dashboards you can open and play with today.',
    ogTitle: 'cascivo',
  },
  '/accessibility': {
    title: 'Accessibility — cascivo',
    description:
      'How cascivo meets WCAG 2.2 AA: zero axe violations in CI, keyboard and screen-reader support, and a representative assistive-technology support matrix.',
  },
  '/performance': {
    title: 'Performance — cascivo',
    description:
      'cascivo performance: signal-driven fine-grained updates, per-component CSS, and measured benchmarks against popular React UI libraries — fewer re-renders, smaller bundles.',
  },
  '/guides': {
    title: 'Guides — cascivo',
    description:
      'Guides for adopting cascivo: migrating from shadcn, brand customization, real use-case scenarios, and an honest take on when not to use it.',
  },
  '/modern-css': {
    title: 'Modern CSS — cascivo',
    description:
      'Why cascivo uses modern CSS: @layer for cascade control without specificity wars, @container for components that respond to their slot, and :has() for conditional styling without JavaScript.',
    ogTitle: 'Modern CSS — cascivo',
  },
  '/examples': {
    title: 'Examples — cascivo',
    description:
      'Five functional example dashboards built with cascivo — each modelled on a well-known SaaS product (Vercel, Stripe, Camunda, Linear, Datadog). Open one and play: no backend, no accounts, no setup.',
    ogTitle: 'cascivo examples',
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
  '/ai': {
    title: 'AI layer — cascivo',
    description:
      'cascivo is AI-first: every component ships a machine-readable manifest that powers an MCP server, Claude Code skills, and llms.txt. Connect the MCP server, let your agent read every manifest, build real UI, and audit it with cascivo audit --ai.',
    ogTitle: 'cascivo AI layer',
  },
  '/create': {
    title: 'Create a theme — cascivo',
    description:
      'Design your cascivo theme in seconds: pick an accent colour, border radius, and font — see real components update live, then copy the CSS.',
    ogTitle: 'cascivo theme configurator',
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
  'guides',
  'modern-css',
  'examples',
  'examples/deploy',
  'examples/pay',
  'examples/flow',
  'examples/track',
  'examples/pulse',
  'ai',
  'create',
  'blocks',
] as const

export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}
