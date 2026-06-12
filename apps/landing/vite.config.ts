import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../..')

const DEEP_LINK_ROUTES = ['accessibility', 'performance']

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
  plugins: [deepLinkCopies(), benchData()],
  preview: { port: 4180, strictPort: true },
  server: { port: 4180 },
  resolve: {
    alias: {
      // Profiling build so the SignalsDemo <Profiler> commit counters work in
      // production bundles (prod react-dom compiles onRender away). Marginally
      // slower than the prod build — intentional on a page that demos re-renders.
      'react-dom/client': 'react-dom/profiling',
      '@cascade-ui/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascade-ui/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascade-ui/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascade-ui/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascade-ui/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascade-ui/icons': resolve(root, 'packages/icons/src/index.tsx'),
    },
  },
})
