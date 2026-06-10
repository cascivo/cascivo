import { defineConfig } from 'vite-plus'

export default defineConfig({
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
