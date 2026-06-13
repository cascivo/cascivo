import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      '@cascivo/core': resolve(__dirname, '../../../packages/core/src/index.ts'),
      '@cascivo/storage': resolve(__dirname, '../../../packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(__dirname, '../../../packages/i18n/src/index.ts'),
      '@cascivo/ai': resolve(__dirname, '../../../packages/ai/src/index.ts'),
      '@cascivo/react': resolve(__dirname, '../../../packages/react/src/index.ts'),
      '@cascivo/render': resolve(__dirname, '../../../packages/render/src/index.ts'),
    },
  },
})
