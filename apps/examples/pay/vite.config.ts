import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

export default defineConfig({
  server: {
    port: 4182,
    strictPort: true,
    // Inject absolute asset URLs so the landing dev proxy can serve the initial
    // HTML while the browser fetches all resources directly from this server.
    origin: 'http://localhost:4182',
  },
  // Relative base so the same build runs at `/` (standalone `vp preview`) and
  // when assembled under `/demos/pay/` in the landing (v22). The app has no
  // internal client routing, so relative asset URLs are always correct.
  base: './',
  resolve: {
    alias: {
      // Source aliases so Rolldown doesn't need pre-built dist files
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
      // example-kit is source-only, alias to its src entry
      '@cascivo/example-kit': resolve(__dirname, '../kit/src/index.ts'),
    },
  },
})
