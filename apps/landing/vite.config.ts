import { copyFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../..')

const DEEP_LINK_ROUTES = ['accessibility', 'performance', 'guides']

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

function deepLinkCopies(): Plugin {
  return {
    name: 'cascade:deep-link-copies',
    apply: 'build',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      for (const route of DEEP_LINK_ROUTES) {
        mkdirSync(resolve(dist, route), { recursive: true })
        copyFileSync(resolve(dist, 'index.html'), resolve(dist, route, 'index.html'))
      }
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
  plugins: [injectCounts(), deepLinkCopies(), benchData()],
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
