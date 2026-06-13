import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')

export default defineConfig({
  resolve: {
    alias: {
      '@cascade-ui/registry': resolve(root, 'packages/registry/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^node:/, '@cascade-ui/registry'],
    },
  },
  test: {
    environment: 'node',
  },
})
