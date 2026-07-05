import { getComponent } from './data'

const SITE_URL = 'https://cascivo.com'
const SUFFIX = ' — cascivo docs'
const DEFAULT_DESCRIPTION =
  'Documentation for cascivo — the CSS-native, signal-driven, AI-first React design system. Browse components, explore context, and build with AI.'

interface RouteHead {
  title: string
  description: string
}

/** Per-route head for the static (non-component) docs routes. */
const ROUTE_HEAD: Record<string, RouteHead> = {
  '/': {
    title: 'cascivo docs',
    description: DEFAULT_DESCRIPTION,
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
    title: `Component directory${SUFFIX}`,
    description: 'The full searchable index of every cascivo component, layout, block, and chart.',
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

/** Resolve the head (title + description) for a path, including component pages. */
function headFor(path: string): { head: RouteHead; index: boolean } {
  // Docs lives under /docs on the unified domain; ROUTE_HEAD keys are
  // docs-relative ('/', '/ai', '/components/:name'), so strip the prefix first.
  const rel = path === '/docs' ? '/' : path.replace(/^\/docs/, '') || '/'
  const known = ROUTE_HEAD[rel]
  if (known) return { head: known, index: true }

  const componentMatch = rel.match(/^\/components\/([^/]+)$/)
  if (componentMatch) {
    const entry = getComponent(decodeURIComponent(componentMatch[1] ?? ''))
    if (entry) {
      return {
        head: { title: `${entry.meta.name}${SUFFIX}`, description: entry.meta.description },
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
}
