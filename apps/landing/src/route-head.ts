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
      'cascivo is the CSS-native, signal-driven, AI-first React design system: owned-code React components, 10 themes, an MCP server, and WCAG 2.2 AA — plus five functional example dashboards you can open and play with today.',
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
  '/examples': {
    title: 'Examples — cascivo',
    description:
      'Five functional example dashboards built with cascivo — each modelled on a well-known SaaS product (Vercel, Stripe, Camunda, Linear, Datadog). Open one and play: no backend, no accounts, no setup.',
    ogTitle: 'cascivo examples',
  },
}

/** Routes that get prerendered + listed in the sitemap (excludes `/` root and `/og`). */
export const PRERENDER_ROUTES = ['accessibility', 'performance', 'guides', 'examples'] as const

export function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}
