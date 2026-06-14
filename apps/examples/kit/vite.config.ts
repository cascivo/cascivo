import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

export default defineConfig({
  resolve: {
    alias: {
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
    },
  },
})
