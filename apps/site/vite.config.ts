import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path, { extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { imagetools } from 'vite-imagetools'
import { type Plugin, defineConfig } from 'vite-plus'
import {
  CATEGORY_INTRO,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  categoryDescription,
  categoryTitle,
} from './src/category-head'
import {
  accessibilityGuideDescription,
  accessibilityGuideTitle,
} from './src/accessibility-guide-head'
import { componentOgImage, componentTitle } from './src/component-head'
import { ROUTE_HEAD, canonicalFor, PRERENDER_ROUTES } from './src/marketing/route-head'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = path.resolve(__dirname, '../..')
const preactCompat = path.resolve(__dirname, 'node_modules/preact/compat')
const preactJsxRuntime = path.resolve(__dirname, 'node_modules/preact/jsx-runtime')

/** Single source of truth for the headline counts injected into static HTML. */
export function componentCount(): number {
  const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf8')) as {
    components: unknown[]
  }
  return registry.components.length
}

// `all.css` (light+dark bundle), `base.css` (typography reset), and
// `tailwind.css` (interop sheet) are not user-facing themes — exclude them so
// the injected count tracks selectable themes. Keep in sync with NON_THEME_CSS
// in scripts/readme/generate.ts.
const NON_THEME_CSS = new Set(['all.css', 'base.css', 'tailwind.css'])

export function themeCount(): number {
  return readdirSync(resolve(root, 'packages/themes/src')).filter(
    (f) => f.endsWith('.css') && !NON_THEME_CSS.has(f),
  ).length
}

/**
 * Replace `%CASCIVO_COMPONENT_COUNT%` / `%CASCIVO_THEME_COUNT%` placeholders in
 * index.html with live values read from registry.json + packages/themes/src.
 */
function injectCounts(): Plugin {
  return {
    name: 'cascade:inject-counts',
    transformIndexHtml(html) {
      return html
        .replaceAll('%CASCIVO_COMPONENT_COUNT%', String(componentCount()))
        .replaceAll('%CASCIVO_THEME_COUNT%', String(themeCount()))
    },
  }
}

/**
 * Per-route head prerender (head-only static). Browserless + deterministic: copy
 * the built shell into `dist/<route>/index.html` and rewrite the head tags
 * (title, description, canonical, og:*, twitter:*) from marketing/route-head.ts,
 * so crawlers / AI engines / social cards get correct per-route previews with JS
 * disabled. The body remains the SPA shell (hydrated client-side).
 */
function rewriteHead(
  html: string,
  opts: {
    title: string
    description: string
    canonical: string
    ogTitle: string
    robots: string
    ogImage?: string
  },
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  const metaContent = (h: string, attrPair: string, value: string) =>
    h.replace(
      new RegExp(
        `(<meta\\s+${attrPair.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+content=")[\\s\\S]*?(")`,
      ),
      `$1${esc(value)}$2`,
    )
  let out = html
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(opts.title)}</title>`)
  out = metaContent(out, 'name="description"', opts.description)
  out = metaContent(out, 'name="robots"', opts.robots)
  out = out.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${esc(opts.canonical)}$2`)
  out = metaContent(out, 'property="og:title"', opts.ogTitle)
  out = metaContent(out, 'property="og:description"', opts.description)
  out = metaContent(out, 'property="og:url"', opts.canonical)
  out = metaContent(out, 'name="twitter:title"', opts.ogTitle)
  out = metaContent(out, 'name="twitter:description"', opts.description)
  if (opts.ogImage) {
    const abs = `https://cascivo.com${opts.ogImage}`
    out = metaContent(out, 'property="og:image"', abs)
    out = metaContent(out, 'name="twitter:image"', abs)
  }
  return out
}

/**
 * Escape text for interpolation into either HTML text nodes or attribute
 * values — used throughout the static SEO body renderers below, since all of
 * it is built from manifest/registry data (component descriptions, code
 * examples, prop docs) via plain string concatenation, not JSX.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Replace the empty `<div id="app"></div>` shell with one containing static,
 * non-interactive body markup. This is deliberately NOT a hydration target:
 * main.tsx clears #app before mounting Preact, so this markup only needs to
 * exist for crawlers/social scrapers/AI agents that don't execute JS — it can
 * never cause a hydration mismatch because Preact never tries to reconcile
 * against it.
 */
function injectBody(html: string, bodyHtml: string): string {
  return html.replace('<div id="app"></div>', `<div id="app">${bodyHtml}</div>`)
}

function renderMarketingBody(head: {
  title: string
  ogTitle?: string
  description: string
}): string {
  const h1 = escapeHtml(head.ogTitle ?? head.title)
  return (
    `<main><h1>${h1}</h1>` +
    `<p>${escapeHtml(head.description)}</p>` +
    `<p><a href="/docs">Browse the docs →</a></p></main>`
  )
}

interface RegistryPropMeta {
  name: string
  type: string
  default?: string
  description?: string
}

interface RegistryRelated {
  name: string
  reason: string
}

interface RegistryAntiPattern {
  bad: string
  good?: string
  why: string
}

interface RegistryIntent {
  whenToUse?: string[]
  whenNotToUse?: string[]
  related?: RegistryRelated[]
  antiPatterns?: RegistryAntiPattern[]
  a11yRationale?: string
}

interface RegistryComponentMeta {
  name: string
  description: string
  states: string[]
  variants: string[]
  sizes: string[]
  props: RegistryPropMeta[]
  tokens: string[]
  accessibility: { wcag: string; role: string; keyboard: string[] }
  examples: { title: string; code: string; description?: string }[]
  tags: string[]
  intent?: RegistryIntent
}

interface RegistryComponentEntry {
  name: string
  type?: string
  category: string
  meta: RegistryComponentMeta
}

function loadRegistryComponents(): RegistryComponentEntry[] {
  const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf8')) as {
    components: RegistryComponentEntry[]
  }
  return registry.components
}

// Category-prefixed registry slugs (`chart/area-chart`, `layout/stack`) mean a
// related-component display name like "AreaChart" can't be slugified straight
// to its route — try each known prefix in turn. Keep in sync with the root
// dirs scanned by scripts/registry/generate.ts.
const REGISTRY_SLUG_PREFIXES = ['', 'layout/', 'chart/', 'block/', 'editor/', 'flow/', 'section/']

function slugifyComponentName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

/** Resolve an `intent.related[].name` display name to a real registry slug, or null if it isn't a separately-registered component (e.g. a sub-part or utility). */
function resolveRelatedSlug(displayName: string, knownSlugs: Set<string>): string | null {
  const slug = slugifyComponentName(displayName)
  for (const prefix of REGISTRY_SLUG_PREFIXES) {
    if (knownSlugs.has(prefix + slug)) return prefix + slug
  }
  return null
}

/**
 * `SoftwareSourceCode` JSON-LD for a component page — machine-readable
 * confirmation of what the static body already says in prose, for crawlers/AI
 * engines that weight structured data. Embedded statically (not runtime-only
 * like the existing BreadcrumbList in seo.ts) so it's visible with JS off too.
 */
function renderComponentJsonLd(entry: RegistryComponentEntry, canonical: string): string {
  const { meta } = entry
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: meta.name,
    description: meta.description,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'React',
    about: entry.category,
    keywords: meta.tags.join(', '),
    url: canonical,
    license: 'https://opensource.org/licenses/MIT',
    isPartOf: { '@id': 'https://cascivo.com/#org' },
  }
  // Defend against a `</script>`-like sequence in any string value breaking out
  // of the script tag early — none of the current data contains one, but this
  // is free insurance since it's all sourced from manifests, not our copy.
  const json = JSON.stringify(ld).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

/**
 * Static SEO body for a `/docs/components/<name>` page — built entirely from
 * registry.json data (no component execution), so it's safe to generate at
 * build time. Mirrors the sections ComponentPage.tsx renders at runtime.
 */
function renderComponentBody(entry: RegistryComponentEntry, knownSlugs: Set<string>): string {
  const e = escapeHtml
  const { meta } = entry

  const chipList = (items: string[]) =>
    items.length ? `<ul>${items.map((v) => `<li>${e(v)}</li>`).join('')}</ul>` : ''

  const propsRows = meta.props
    .map(
      (p) =>
        `<tr><td><code>${e(p.name)}</code></td><td><code>${e(p.type)}</code></td>` +
        `<td>${p.default !== undefined ? `<code>${e(p.default)}</code>` : '—'}</td>` +
        `<td>${e(p.description ?? '')}</td></tr>`,
    )
    .join('')
  const propsTable = meta.props.length
    ? `<h2>Props</h2><table><thead><tr><th>Prop</th><th>Type</th><th>Default</th>` +
      `<th>Description</th></tr></thead><tbody>${propsRows}</tbody></table>`
    : ''

  const tokens = meta.tokens.length
    ? `<h2>Design tokens</h2><ul>${meta.tokens.map((t) => `<li><code>${e(t)}</code></li>`).join('')}</ul>`
    : ''

  const examples = meta.examples.length
    ? `<h2>Examples</h2>${meta.examples
        .map(
          (ex) =>
            `<h3>${e(ex.title)}</h3>` +
            (ex.description ? `<p>${e(ex.description)}</p>` : '') +
            `<pre><code>${e(ex.code)}</code></pre>`,
        )
        .join('')}`
    : ''

  const whenToUse = meta.intent?.whenToUse?.length
    ? `<h2>When to use</h2>${chipList(meta.intent.whenToUse)}`
    : ''
  const whenNotToUse = meta.intent?.whenNotToUse?.length
    ? `<h2>When not to use</h2>${chipList(meta.intent.whenNotToUse)}`
    : ''

  const related = meta.intent?.related?.length
    ? `<h2>Related components</h2><ul>${meta.intent.related
        .map((r) => {
          const slug = resolveRelatedSlug(r.name, knownSlugs)
          const label = slug ? `<a href="/docs/components/${e(slug)}">${e(r.name)}</a>` : e(r.name)
          return `<li>${label} — ${e(r.reason)}</li>`
        })
        .join('')}</ul>`
    : ''

  const accessibilityGuideLink =
    (entry.type ?? 'component') === 'component'
      ? `<p><a href="/accessibility/${e(entry.name)}">How to build an accessible ${e(meta.name)} in React →</a></p>`
      : ''

  return (
    `<article>` +
    `<h1>${e(meta.name)}</h1>` +
    `<p>${e(meta.description)}</p>` +
    `<p>Category: <a href="/docs/categories/${e(entry.category)}">${e(entry.category)}</a> · WCAG ${e(meta.accessibility.wcag)}` +
    (meta.tags.length ? ` · ${meta.tags.map(e).join(', ')}` : '') +
    `</p>` +
    (meta.variants.length ? `<h2>Variants</h2>${chipList(meta.variants)}` : '') +
    (meta.sizes.length ? `<h2>Sizes</h2>${chipList(meta.sizes)}` : '') +
    (meta.states.length ? `<h2>States</h2>${chipList(meta.states)}` : '') +
    propsTable +
    tokens +
    whenToUse +
    whenNotToUse +
    accessibilityGuideLink +
    examples +
    related +
    `<p><a href="/docs">← Back to docs</a></p>` +
    `</article>`
  )
}

/**
 * Static SEO body for a `/docs/categories/<category>` page — grouped straight
 * from registry.json, mirrors CategoryPage.tsx.
 */
function renderCategoryBody(
  category: (typeof CATEGORY_ORDER)[number],
  items: RegistryComponentEntry[],
): string {
  const e = escapeHtml
  const label = CATEGORY_LABELS[category]
  const rows = items
    .slice()
    .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
    .map(
      (c) =>
        `<li><a href="/docs/components/${e(c.name)}">${e(c.meta.name)}</a> — ${e(c.meta.description)}</li>`,
    )
    .join('')
  return (
    `<article>` +
    `<h1>${e(label)}</h1>` +
    `<p>${e(CATEGORY_INTRO[category])}</p>` +
    `<h2>${items.length} ${e(label.toLowerCase())} component${items.length === 1 ? '' : 's'}</h2>` +
    `<ul>${rows}</ul>` +
    `<p><a href="/docs">← Back to docs</a></p>` +
    `</article>`
  )
}

/**
 * Static SEO body for a `/accessibility/<name>` guide page — leads with the
 * intent/a11y narrative (when to use, keyboard, common mistakes), not the
 * props table, so it doesn't read as a near-duplicate of the component
 * reference page. Mirrors AccessibleComponentPage.tsx.
 */
function renderAccessibilityGuideBody(entry: RegistryComponentEntry): string {
  const e = escapeHtml
  const { meta } = entry
  const intent = meta.intent

  const list = (items: string[]) => `<ul>${items.map((v) => `<li>${e(v)}</li>`).join('')}</ul>`

  const whenToUse = intent?.whenToUse?.length
    ? `<h2>When to use a ${e(meta.name)}</h2>${list(intent.whenToUse)}`
    : ''
  const whenNotToUse = intent?.whenNotToUse?.length
    ? `<h2>When not to use it</h2>${list(intent.whenNotToUse)}`
    : ''

  const a11yIntro = `<p>Role <code>${e(meta.accessibility.role)}</code>, verified at WCAG ${e(meta.accessibility.wcag)}.</p>`
  const keyboard = meta.accessibility.keyboard.length
    ? `<h2>Keyboard interactions</h2>${a11yIntro}<ul>${meta.accessibility.keyboard
        .map((k) => `<li><code>${e(k)}</code></li>`)
        .join('')}</ul>`
    : `<h2>Accessibility</h2>${a11yIntro}`

  const antiPatterns = intent?.antiPatterns?.length
    ? `<h2>Common mistakes</h2>${intent.antiPatterns
        .map(
          (ap) =>
            `<p><strong>Avoid:</strong> <code>${e(ap.bad)}</code></p>` +
            (ap.good ? `<p><strong>Prefer:</strong> <code>${e(ap.good)}</code></p>` : '') +
            `<p>${e(ap.why)}</p>`,
        )
        .join('')}`
    : ''

  const example = meta.examples.length
    ? `<h2>Example</h2><pre><code>${e(meta.examples[0]?.code ?? '')}</code></pre>`
    : ''

  return (
    `<article>` +
    `<h1>How to build an accessible ${e(meta.name)} in React</h1>` +
    `<p>${e(intent?.a11yRationale ?? '')}</p>` +
    whenToUse +
    whenNotToUse +
    keyboard +
    antiPatterns +
    example +
    `<p><a href="/docs/components/${e(entry.name)}">See the full ${e(meta.name)} reference →</a></p>` +
    `</article>`
  )
}

function prerenderPages(): Plugin {
  return {
    name: 'cascade:prerender-pages',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const shellPath = resolve(dist, 'index.html')
      // Guard: closeBundle can fire before/without the HTML emit in some build
      // phases (multi-environment). Skip rather than abort the whole build.
      if (!existsSync(shellPath)) return
      const shell = readFileSync(shellPath, 'utf8')

      // Home ('/') keeps the shell's own head (already correct) but still gets
      // a static body — it's the single highest-value URL on the site.
      const homeHead = ROUTE_HEAD['/']
      if (homeHead) {
        writeFileSync(shellPath, injectBody(shell, renderMarketingBody(homeHead)))
      }

      for (const route of PRERENDER_ROUTES) {
        const head = ROUTE_HEAD[`/${route}`]
        if (!head) continue
        const html = rewriteHead(shell, {
          title: head.title,
          description: head.description,
          canonical: canonicalFor(`/${route}`),
          ogTitle: head.ogTitle ?? head.title,
          robots: 'index, follow',
          ogImage: head.ogImage,
        })
        mkdirSync(resolve(dist, route), { recursive: true })
        writeFileSync(
          resolve(dist, route, 'index.html'),
          injectBody(html, renderMarketingBody(head)),
        )
      }

      // Docs component pages (/docs/components/<name>) — the largest single
      // page family and, until now, not prerendered at all: their head was
      // client-JS-only and their body was always an empty shell. Both are
      // fully derivable from registry.json, so generate real HTML for every
      // one at build time.
      const components = loadRegistryComponents()
      const knownSlugs = new Set(components.map((c) => c.name.toLowerCase()))
      for (const entry of components) {
        const path = `/docs/components/${entry.name}`
        const canonical = canonicalFor(path)
        const title = componentTitle(entry.meta)
        const html = rewriteHead(shell, {
          title,
          description: entry.meta.description,
          canonical,
          ogTitle: title,
          robots: 'index, follow',
          ogImage: componentOgImage(entry.name),
        })
        const outDir = resolve(dist, 'docs', 'components', entry.name)
        mkdirSync(outDir, { recursive: true })
        const body =
          renderComponentBody(entry, knownSlugs) + renderComponentJsonLd(entry, canonical)
        writeFileSync(resolve(outDir, 'index.html'), injectBody(html, body))
      }

      // Docs category pages (/docs/categories/<category>) — one per registry
      // category, grouping every component in it with a short factual intro.
      for (const category of CATEGORY_ORDER) {
        const items = components.filter((c) => c.category === category)
        if (items.length === 0) continue
        const path = `/docs/categories/${category}`
        const canonical = canonicalFor(path)
        const title = categoryTitle(category, items.length)
        const html = rewriteHead(shell, {
          title,
          description: categoryDescription(category, items.length),
          canonical,
          ogTitle: title,
          robots: 'index, follow',
        })
        const outDir = resolve(dist, 'docs', 'categories', category)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(
          resolve(outDir, 'index.html'),
          injectBody(html, renderCategoryBody(category, items)),
        )
      }

      // Per-component accessibility guides (/accessibility/<name>) — one per
      // `type: 'component'` registry entry (real UI controls; charts/layouts/
      // blocks are covered by their component reference page instead). Built
      // from meta.intent, distinct framing from /docs/components/<name> so it
      // doesn't read as near-duplicate content.
      for (const entry of components) {
        if ((entry.type ?? 'component') !== 'component') continue
        const path = `/accessibility/${entry.name}`
        const canonical = canonicalFor(path)
        const title = accessibilityGuideTitle(entry.meta)
        const html = rewriteHead(shell, {
          title,
          description: accessibilityGuideDescription({
            name: entry.meta.name,
            a11yRationale: entry.meta.intent?.a11yRationale ?? '',
          }),
          canonical,
          ogTitle: title,
          robots: 'index, follow',
        })
        const outDir = resolve(dist, 'accessibility', entry.name)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(
          resolve(outDir, 'index.html'),
          injectBody(html, renderAccessibilityGuideBody(entry)),
        )
      }

      // Static-host fallback for unknown deep links → real NotFound (noindex).
      const notFound = rewriteHead(shell, {
        title: 'Not found — cascivo',
        description: ROUTE_HEAD['/']?.description ?? '',
        canonical: canonicalFor('/'),
        ogTitle: 'cascivo',
        robots: 'noindex, follow',
      })
      writeFileSync(resolve(dist, '404.html'), notFound)
    },
  }
}

function stripSamples(obj: unknown): void {
  if (Array.isArray(obj)) return
  if (obj === null || typeof obj !== 'object') return
  const o = obj as Record<string, unknown>
  for (const key of Object.keys(o)) {
    if (key === 'samples') {
      delete o[key]
    } else {
      stripSamples(o[key])
    }
  }
}

function benchData(): Plugin {
  const virtualId = 'virtual:bench'
  const resolvedId = '\0virtual:bench'
  return {
    name: 'cascade:bench-data',
    resolveId(id) {
      return id === virtualId ? resolvedId : null
    },
    load(id) {
      if (id !== resolvedId) return null
      const raw = JSON.parse(
        readFileSync(resolve(root, 'apps/bench/results/results.json'), 'utf8'),
      ) as unknown
      stripSamples(raw)
      return `export default ${JSON.stringify(raw)}`
    },
  }
}

/**
 * In dev mode, serve pre-built example app dists statically at /demos/<slug>/.
 * Built apps use base:'./' so relative asset paths resolve in the browser.
 * Missing dists fall through to the SPA (which shows Not Found).
 */
function serveExampleDemos(): Plugin {
  const examplesDir = resolve(__dirname, '../examples')
  const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
  }
  return {
    name: 'cascade:serve-example-demos',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/demos', (req, res, next) => {
        const raw = (req.url ?? '/').replace(/^\//, '')
        const [slug, ...rest] = raw.split('/')
        if (!slug) {
          next()
          return
        }
        const distDir = resolve(examplesDir, slug, 'dist')
        if (!existsSync(distDir)) {
          next()
          return
        }
        const sub = rest.filter(Boolean).join('/')
        const candidate = resolve(distDir, sub || 'index.html')
        const filePath =
          !existsSync(candidate) || statSync(candidate).isDirectory()
            ? !extname(sub)
              ? resolve(distDir, 'index.html')
              : null
            : candidate
        if (!filePath || !existsSync(filePath)) {
          next()
          return
        }
        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

// Block component + meta aliases (more-specific /component paths must precede the
// bare-name meta aliases). Built from one list to keep them in sync.
const BLOCK_NAMES = [
  'app-shell',
  'auth-login',
  'auth-signup',
  'dashboard-overview',
  'dashboard-table',
  'faq',
  'marketing-features',
  'marketing-hero',
  'pricing',
  'settings-profile',
  'site-footer',
  'testimonials',
] as const

const blockAliases: Record<string, string> = {}
for (const n of BLOCK_NAMES) {
  blockAliases[`@cascivo/blocks/${n}/component`] = resolve(
    root,
    `packages/components/src/blocks/${n}/${n}.tsx`,
  )
}
for (const n of BLOCK_NAMES) {
  blockAliases[`@cascivo/blocks/${n}`] = resolve(
    root,
    `packages/components/src/blocks/${n}/${n}.meta.ts`,
  )
}

export default defineConfig({
  plugins: [imagetools(), injectCounts(), prerenderPages(), benchData(), serveExampleDemos()],
  define: {
    __CASCIVO_COMPONENT_COUNT__: componentCount(),
    __CASCIVO_THEME_COUNT__: themeCount(),
  },
  // Emit source maps for the production bundle. The project is public (MIT), so
  // there is nothing to hide, and Lighthouse's "valid source maps" best-practices
  // audit needs them to map the large first-party JS back to source.
  build: { sourcemap: true },
  preview: { port: 4180, strictPort: true },
  server: {
    port: 4180,
    // Allow importing registry.json from the monorepo root.
    fs: { allow: [root] },
  },
  resolve: {
    alias: {
      // Preact compat — the merged app runs on Preact; React imports resolve here.
      'react/jsx-runtime': preactJsxRuntime,
      'react/jsx-dev-runtime': preactJsxRuntime,
      react: preactCompat,
      'react-dom': preactCompat,
      // Workspace packages → source so Rolldown needs no pre-built dist.
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
      '@cascivo/editor': resolve(root, 'packages/editor/src/index.ts'),
      '@cascivo/flow': resolve(root, 'packages/flow/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/registry': resolve(root, 'packages/registry/src/index.ts'),
      '@cascivo/search/SearchDialog': resolve(root, 'packages/search/src/SearchDialog.tsx'),
      '@cascivo/search': resolve(root, 'packages/search/src/index.ts'),
      '@cascivo/components/blocks/types': resolve(root, 'packages/components/src/blocks/types.ts'),
      ...blockAliases,
      // Browser-safe audit-ai analyzers (no Node deps) — used by the Context Explorer.
      'cascivo/audit-ai': resolve(root, 'packages/cli/src/audit-ai/index.ts'),
    },
  },
})
