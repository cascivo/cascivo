import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      '@cascade-ui/react': resolve(__dirname, '../../../packages/react/src/index.ts'),
      '@cascade-ui/render': resolve(__dirname, '../../../packages/render/src/index.ts'),
    },
  },
})
