import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      '@cascade-ui/react': resolve(__dirname, '../react/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@preact/signals-react', '@cascade-ui/react'],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
