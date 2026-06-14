import registry from '../../../registry.json'

const componentCount = (registry as { components: unknown[] }).components.length

export const SITE_URL = 'https://cascivo.com'

export type RouteSeo = {
  /** Unique meta description for the route (each virtual page needs its own). */
  description: string
  /** Absolute canonical URL for the route. */
  canonical: string
  /** Optional og/twitter title override (defaults to the route title). */
  ogTitle?: string
}

const HOME_SEO: RouteSeo = {
  description: `cascivo is the CSS-native, signal-driven, AI-first React design system: ${componentCount}+ owned-code React components, 10 themes, an MCP server, and WCAG 2.2 AA — beautiful by default.`,
  canonical: `${SITE_URL}/`,
}

/**
 * Per-route head metadata. `title` is NOT duplicated here — it comes from
 * `ROUTES[path].title` in App.tsx (single source of truth). Descriptions are
 * unique per route so crawlers/AI answer-engines get distinct previews.
 */
export const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': HOME_SEO,
  '/accessibility': {
    description:
      'How cascivo meets WCAG 2.2 AA: zero axe violations in CI, keyboard and screen-reader support, and a representative assistive-technology support matrix.',
    canonical: `${SITE_URL}/accessibility`,
  },
  '/performance': {
    description:
      'cascivo performance: signal-driven fine-grained updates, per-component CSS, and measured benchmarks against popular React UI libraries — fewer re-renders, smaller bundles.',
    canonical: `${SITE_URL}/performance`,
  },
  '/guides': {
    description:
      'Guides for adopting cascivo: migrating from shadcn, brand customization, real use-case scenarios, and an honest take on when not to use it.',
    canonical: `${SITE_URL}/guides`,
  },
}

/** Update or create a meta/link tag, matching it by `selector`. */
function setMeta(
  selector: string,
  spec: { tag: 'meta' | 'link'; attrName: 'name' | 'property' | 'rel'; key: string },
  attr: 'content' | 'href',
  value: string,
): void {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(spec.tag)
    el.setAttribute(spec.attrName, spec.key)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/** Apply the per-route head (title + description + canonical + og + twitter). */
export function applyRouteSeo(path: string, title: string): void {
  if (typeof document === 'undefined') return
  const seo = ROUTE_SEO[path] ?? HOME_SEO
  const ogTitle = seo.ogTitle ?? title

  document.title = title
  setMeta(
    'meta[name="description"]',
    { tag: 'meta', attrName: 'name', key: 'description' },
    'content',
    seo.description,
  )
  setMeta(
    'link[rel="canonical"]',
    { tag: 'link', attrName: 'rel', key: 'canonical' },
    'href',
    seo.canonical,
  )
  setMeta(
    'meta[property="og:title"]',
    { tag: 'meta', attrName: 'property', key: 'og:title' },
    'content',
    ogTitle,
  )
  setMeta(
    'meta[property="og:description"]',
    { tag: 'meta', attrName: 'property', key: 'og:description' },
    'content',
    seo.description,
  )
  setMeta(
    'meta[property="og:url"]',
    { tag: 'meta', attrName: 'property', key: 'og:url' },
    'content',
    seo.canonical,
  )
  setMeta(
    'meta[name="twitter:title"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:title' },
    'content',
    ogTitle,
  )
  setMeta(
    'meta[name="twitter:description"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:description' },
    'content',
    seo.description,
  )
}
