import { copyFileSync, mkdirSync } from 'node:fs'
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

export default defineConfig({
  plugins: [deepLinkCopies()],
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
