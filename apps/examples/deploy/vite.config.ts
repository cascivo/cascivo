import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
  // Relative base so the same build runs at `/` (standalone `vp preview`) and
  // when assembled under `/demos/deploy/` in the landing (v22). The app has no
  // internal client routing, so relative asset URLs are always correct.
  base: './',
  server: {
    port: 4181,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Source aliases so Rolldown doesn't need pre-built dist files
      // Must precede the bare '@cascivo/core' entry: a string alias replaces by
      // prefix, so without this '@cascivo/core/pure' resolves to 'index.ts/pure'.
      '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/charts/sparkline': resolve(root, 'packages/charts/src/sparkline.ts'),
      '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
      // example-kit is source-only, alias to its src entry
      '@cascivo/example-kit': resolve(__dirname, '../kit/src/index.ts'),
    },
  },
})
