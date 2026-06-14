import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite-plus'
import { ROUTE_HEAD, canonicalFor, PRERENDER_ROUTES } from './src/route-head'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../..')

/** Single source of truth for the headline counts injected into static HTML. */
export function componentCount(): number {
  const registry = JSON.parse(readFileSync(resolve(root, 'registry.json'), 'utf8')) as {
    components: unknown[]
  }
  return registry.components.length
}

export function themeCount(): number {
  return readdirSync(resolve(root, 'packages/themes/src')).filter((f) => f.endsWith('.css')).length
}

/**
 * Replace `%CASCIVO_COMPONENT_COUNT%` / `%CASCIVO_THEME_COUNT%` placeholders in
 * index.html with live values read from registry.json + packages/themes/src.
 * Keeps the headline numbers from ever silently rotting (roadmap v19 #1).
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
 * Per-route head prerender (roadmap v19 T3).
 *
 * APPROACH B (head-only static) shipped, not full-body prerender (A). Rationale:
 * the landing deploy job (`.github/workflows/cf-pages.yml` deploy-landing) runs
 * `vp run @cascivo/landing#build` WITHOUT `npx playwright install`, so headless
 * Chromium is not available at deploy time — a build-time browser prerender
 * would break the deploy. This step is browserless and deterministic: it copies
 * the built shell into `dist/<route>/index.html` and rewrites the head tags
 * (title, description, canonical, og:*, twitter:*) from src/route-head.ts, so
 * crawlers / AI answer-engines / social cards get correct per-route previews
 * with JS disabled. The body remains the SPA shell (hydrated client-side).
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
      const shell = readFileSync(resolve(dist, 'index.html'), 'utf8')

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
      // The SPA boots, reads the (unknown) pathname, and renders <NotFound />.
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

export default defineConfig({
  plugins: [injectCounts(), prerenderHeads(), benchData()],
  preview: { port: 4180, strictPort: true },
  server: { port: 4180 },
  resolve: {
    alias: {
      // Profiling build so the SignalsDemo <Profiler> commit counters work in
      // production bundles (prod react-dom compiles onRender away). Marginally
      // slower than the prod build — intentional on a page that demos re-renders.
      'react-dom/client': 'react-dom/profiling',
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/registry': resolve(root, 'packages/registry/src/index.ts'),
    },
  },
})
