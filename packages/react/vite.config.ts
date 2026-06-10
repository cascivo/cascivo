import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'cascade',
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, '@preact/signals-react', '@cascade-ui/core'],
      output: {
        // Components are client components; preserve the directive for RSC consumers.
        banner: "'use client';",
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
})
