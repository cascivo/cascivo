import { CATEGORY_LABELS, categoryDescription, categoryTitle, isCategory } from './category-head'
import { componentOgImage, componentTitle } from './component-head'
import { components, getComponent } from './data'
import { THEME_LABELS, isThemeName, themeDescription, themeTitle } from './theme-head'

const SITE_URL = 'https://cascivo.com'
const SUFFIX = ' — cascivo docs'
const DEFAULT_DESCRIPTION =
  'Documentation for cascivo — the CSS-native, signal-driven, AI-first React design system. Browse components, explore context, and build with AI.'

interface RouteHead {
  title: string
  description: string
  /** Absolute-from-root path to a per-route social card; defaults to /og.png. */
  ogImage?: string
  /** Breadcrumb label, when it isn't derivable by stripping SUFFIX from title. */
  crumbLabel?: string
}

/** Per-route head for the static (non-component) docs routes. */
const ROUTE_HEAD: Record<string, RouteHead> = {
  '/': {
    title: 'cascivo docs',
    description: DEFAULT_DESCRIPTION,
  },
  '/installation': {
    title: `Installation${SUFFIX}`,
    description:
      'Install cascivo: scaffold a new app, use the prebuilt @cascivo/react package, or copy component source into your repo with the CLI.',
  },
  '/getting-started': {
    title: `Getting started${SUFFIX}`,
    description:
      'The fastest path into cascivo — scaffold an app, install the prebuilt package, or copy-paste components with the CLI, plus theming and Next.js setup.',
  },
  '/components': {
    title: `All components${SUFFIX}`,
    description:
      'Every cascivo component, grouped by category, each linking to its full API docs. The machine-readable index is /docs/components.md and /llms.txt.',
  },
  '/editor': {
    title: `Editor${SUFFIX}`,
    description:
      'A CSS-native, signal-driven code editor component — syntax highlighting, find & replace, and a command menu.',
  },
  '/marketplace': {
    title: `Marketplace${SUFFIX}`,
    description:
      'Browse first-party and third-party templates installable with npx cascivo add @ns/<template>.',
  },
  '/tokens': {
    title: `Design tokens${SUFFIX}`,
    description:
      'The three-level cascivo token system — primitive, semantic, and component layers — and how to override them for your brand.',
  },
  '/ai': {
    title: `AI & MCP${SUFFIX}`,
    description:
      'The cascivo AI layer: the @cascivo/mcp server, machine-readable manifests, llms.txt, and bound-vocabulary grammar that lets agents build with cascivo without hallucinating.',
  },
  '/api': {
    title: `API reference${SUFFIX}`,
    description:
      'Every cascivo component prop, variant, and size in one searchable reference — filter by component or prop name.',
  },
  '/keyboard': {
    title: `Keyboard reference${SUFFIX}`,
    description:
      'Every keyboard interaction in cascivo, derived from each component’s manifest — filter by component, ARIA role, or key.',
  },
  '/platform': {
    title: `Built on the platform${SUFFIX}`,
    description:
      'cascivo builds controls on browser-native primitives — native dialog, the Popover API, CSS anchor positioning — not wrapped third-party dependencies. Measured line counts, zero runtime deps.',
  },
  '/faq': {
    title: `FAQ${SUFFIX}`,
    description:
      'Frequently asked questions about cascivo — licensing, adopting one component, Next.js/RSC, Tailwind, theming, and how it compares to shadcn/ui.',
  },
  '/changelog': {
    title: `Changelog${SUFFIX}`,
    description:
      'Major and minor releases per published cascivo package, parsed from changesets — compare against your installed versions to detect API drift.',
  },
  '/upgrading': {
    title: `Upgrading${SUFFIX}`,
    description:
      'How cascivo updates owned copy-in components without clobbering your edits: a versioned registry, a lockfile, and a real three-way merge via cascivo update.',
  },
  '/charts': {
    title: `Charts${SUFFIX}`,
    description:
      'CVD-safe, signal-driven charts built on modern CSS. Browse the @cascivo/charts catalog with live previews and tokens.',
  },
  '/icons': {
    title: `Icons${SUFFIX}`,
    description:
      'Browse and search ~440 stroked 24×24 SVG icons from @cascivo/icons — tree-shakeable named exports, one import. Click any icon to copy its import.',
  },
  '/flow': {
    title: `Flow${SUFFIX}`,
    description:
      'CSS-native, signal-driven node/edge diagrams — flowcharts, DAGs, pipelines, and mind-maps. Pan, zoom, drag, connect, and animated edges, plus scripted FlowStory walkthroughs.',
  },
  '/playground': {
    title: `Playground${SUFFIX}`,
    description: 'Experiment with cascivo components live in the browser.',
  },
  '/benchmarks': {
    title: `Benchmarks${SUFFIX}`,
    description:
      'How cascivo compares to shadcn/ui and IBM Carbon on bundle size and interaction latency — with reproducible methodology.',
  },
  '/layouts': {
    title: `Layouts${SUFFIX}`,
    description:
      'Application layout primitives — app shell, grids, and responsive containers built on container queries and CSS logical properties.',
  },
  '/directory': {
    title: `Registry directory${SUFFIX}`,
    description:
      'Third-party and first-party component registries compatible with the cascivo CLI — search and install from any registry with npx cascivo add @ns/<component>.',
  },
  '/context': {
    title: `Context Explorer${SUFFIX}`,
    description:
      'Explore the machine-readable intent layer: when to use each component, anti-patterns, boundaries, and accessibility rationale.',
  },
  '/why': {
    title: `Why cascivo${SUFFIX}`,
    description:
      'The thesis behind cascivo: modern CSS, fine-grained signals, owned code, and an AI-native context layer with zero compromise.',
  },
  '/parity': {
    title: `Parity matrix${SUFFIX}`,
    description: 'Feature and component parity between cascivo, shadcn/ui, and IBM Carbon.',
  },
  '/migrating': {
    title: `Migrating from shadcn${SUFFIX}`,
    description: 'A practical guide to moving an existing shadcn/ui project to cascivo.',
  },
  '/brand': {
    title: `Brand${SUFFIX}`,
    description: 'cascivo brand guidelines, logos, and color usage.',
  },
  '/perf/data-table': {
    title: `Data table performance${SUFFIX}`,
    description: 'Rendering and interaction performance of the cascivo data table at scale.',
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

function canonicalFor(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

/**
 * Maintain a single BreadcrumbList JSON-LD script in the head (SPA-navigated,
 * so it's updated per route; removed on non-indexable routes). Googlebot renders
 * the client, so this is picked up despite not being in the prerendered HTML.
 */
function setBreadcrumb(items: { name: string; url: string }[] | null): void {
  if (typeof document === 'undefined') return
  const id = 'ld-breadcrumb'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!items) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  })
}

/** Resolve the head (title + description) for a path, including component pages. */
function headFor(path: string): { head: RouteHead; index: boolean } {
  // Docs lives under /docs on the unified domain; ROUTE_HEAD keys are
  // docs-relative ('/', '/ai', '/components/:name'), so strip the prefix first.
  const rel = path === '/docs' ? '/' : path.replace(/^\/docs/, '') || '/'
  const known = ROUTE_HEAD[rel]
  if (known) return { head: known, index: true }

  // Component slugs can carry a category prefix (`chart/area-chart`,
  // `layout/flex`), so match the full remainder, not just one path segment.
  const componentMatch = rel.match(/^\/components\/(.+)$/)
  if (componentMatch) {
    const entry = getComponent(decodeURIComponent(componentMatch[1] ?? ''))
    if (entry) {
      return {
        head: {
          title: componentTitle(entry.meta),
          description: entry.meta.description,
          ogImage: componentOgImage(entry.name),
          crumbLabel: entry.meta.name,
        },
        index: true,
      }
    }
  }

  const categoryMatch = rel.match(/^\/categories\/(.+)$/)
  if (categoryMatch) {
    const key = decodeURIComponent(categoryMatch[1] ?? '')
    if (isCategory(key)) {
      const count = components.filter((c) => c.category === key).length
      if (count > 0) {
        return {
          head: {
            title: categoryTitle(key, count),
            description: categoryDescription(key, count),
            crumbLabel: CATEGORY_LABELS[key],
          },
          index: true,
        }
      }
    }
  }

  const themeMatch = rel.match(/^\/themes\/(.+)$/)
  if (themeMatch) {
    const key = decodeURIComponent(themeMatch[1] ?? '')
    if (isThemeName(key)) {
      return {
        head: {
          title: themeTitle(key),
          description: themeDescription(key),
          crumbLabel: THEME_LABELS[key],
        },
        index: true,
      }
    }
  }

  // Unknown route — title like home but keep it out of the index.
  return { head: { title: `Not found${SUFFIX}`, description: DEFAULT_DESCRIPTION }, index: false }
}

/**
 * Apply the per-route head (title + description + canonical + og + twitter).
 * The docs app is a client-side SPA, so this runs on every navigation.
 */
export function applyDocsSeo(path: string): void {
  if (typeof document === 'undefined') return
  const { head, index } = headFor(path)
  const canonical = canonicalFor(path)

  document.title = head.title
  setMeta(
    'meta[name="robots"]',
    { tag: 'meta', attrName: 'name', key: 'robots' },
    'content',
    index ? 'index, follow' : 'noindex, follow',
  )
  setMeta(
    'meta[name="description"]',
    { tag: 'meta', attrName: 'name', key: 'description' },
    'content',
    head.description,
  )
  setMeta(
    'link[rel="canonical"]',
    { tag: 'link', attrName: 'rel', key: 'canonical' },
    'href',
    canonical,
  )
  setMeta(
    'meta[property="og:title"]',
    { tag: 'meta', attrName: 'property', key: 'og:title' },
    'content',
    head.title,
  )
  setMeta(
    'meta[property="og:description"]',
    { tag: 'meta', attrName: 'property', key: 'og:description' },
    'content',
    head.description,
  )
  const ogImage = `${SITE_URL}${head.ogImage ?? '/og.png'}`
  setMeta(
    'meta[property="og:image"]',
    { tag: 'meta', attrName: 'property', key: 'og:image' },
    'content',
    ogImage,
  )
  setMeta(
    'meta[name="twitter:image"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:image' },
    'content',
    ogImage,
  )
  setMeta(
    'meta[property="og:url"]',
    { tag: 'meta', attrName: 'property', key: 'og:url' },
    'content',
    canonical,
  )
  setMeta(
    'meta[name="twitter:title"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:title' },
    'content',
    head.title,
  )
  setMeta(
    'meta[name="twitter:description"]',
    { tag: 'meta', attrName: 'name', key: 'twitter:description' },
    'content',
    head.description,
  )

  // Breadcrumb: cascivo › Docs › <this page> (skipped on the docs root and on
  // non-indexable / not-found routes).
  if (!index) {
    setBreadcrumb(null)
  } else {
    const crumbs = [
      { name: 'cascivo', url: `${SITE_URL}/` },
      { name: 'Docs', url: `${SITE_URL}/docs` },
    ]
    if (path !== '/docs') {
      crumbs.push({ name: head.crumbLabel ?? head.title.replace(SUFFIX, ''), url: canonical })
    }
    setBreadcrumb(crumbs)
  }
}
