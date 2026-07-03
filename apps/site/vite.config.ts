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
  opts: { title: string; description: string; canonical: string; ogTitle: string; robots: string },
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
  return out
}

function prerenderHeads(): Plugin {
  return {
    name: 'cascade:prerender-heads',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const shellPath = resolve(dist, 'index.html')
      // Guard: closeBundle can fire before/without the HTML emit in some build
      // phases (multi-environment). Skip rather than abort the whole build.
      if (!existsSync(shellPath)) return
      const shell = readFileSync(shellPath, 'utf8')

      for (const route of PRERENDER_ROUTES) {
        const head = ROUTE_HEAD[`/${route}`]
        if (!head) continue
        const html = rewriteHead(shell, {
          title: head.title,
          description: head.description,
          canonical: canonicalFor(`/${route}`),
          ogTitle: head.ogTitle ?? head.title,
          robots: 'index, follow',
        })
        mkdirSync(resolve(dist, route), { recursive: true })
        writeFileSync(resolve(dist, route, 'index.html'), html)
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
  plugins: [imagetools(), injectCounts(), prerenderHeads(), benchData(), serveExampleDemos()],
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
