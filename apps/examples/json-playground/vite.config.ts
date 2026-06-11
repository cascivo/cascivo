import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      '@cascade-ui/core': resolve(__dirname, '../../../packages/core/src/index.ts'),
      '@cascade-ui/storage': resolve(__dirname, '../../../packages/storage/src/index.ts'),
      '@cascade-ui/i18n': resolve(__dirname, '../../../packages/i18n/src/index.ts'),
      '@cascade-ui/ai': resolve(__dirname, '../../../packages/ai/src/index.ts'),
      '@cascade-ui/react': resolve(__dirname, '../../../packages/react/src/index.ts'),
      '@cascade-ui/render': resolve(__dirname, '../../../packages/render/src/index.ts'),
    },
  },
})
