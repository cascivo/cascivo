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
  server: {
    port: 4180,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Source aliases so Rolldown doesn't need pre-built dist files.
      // In your own app (installing from npm) you don't need these.
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
    },
  },
})
