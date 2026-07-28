import { defineConfig } from 'vite-plus'
import { cssImportEdge } from '../../scripts/build/css-import-edge.ts'

export default defineConfig({
  plugins: [cssImportEdge('editor.css')],
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'editor',
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        '@preact/signals-react',
        '@cascivo/core',
        '@cascivo/i18n',
      ],
      output: {
        // The editor surfaces are signal-driven client components; preserve the
        // directive for RSC consumers.
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
