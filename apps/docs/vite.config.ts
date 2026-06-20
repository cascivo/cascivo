import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = path.resolve(__dirname, '../..')
const preactCompat = path.resolve(__dirname, 'node_modules/preact/compat')
const preactJsxRuntime = path.resolve(__dirname, 'node_modules/preact/jsx-runtime')

export default defineConfig({
  resolve: {
    alias: {
      'react/jsx-runtime': preactJsxRuntime,
      'react/jsx-dev-runtime': preactJsxRuntime,
      react: preactCompat,
      'react-dom': preactCompat,
      // Point workspace packages directly to source so Rolldown doesn't need
      // pre-built dist files (avoids CI resolution failures).
      '@cascivo/core': path.resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': path.resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': path.resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/ai': path.resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/render': path.resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/icons': path.resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/charts': path.resolve(root, 'packages/charts/src/index.ts'),
      '@cascivo/registry': path.resolve(root, 'packages/registry/src/index.ts'),
      // Browser-safe audit-ai analyzers (no Node deps) — used by the Context Explorer.
      'cascivo/audit-ai': path.resolve(root, 'packages/cli/src/audit-ai/index.ts'),
    },
  },
  server: {
    // Allow importing registry.json from the monorepo root.
    fs: { allow: [root] },
  },
})
