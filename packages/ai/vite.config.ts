import { defineConfig } from 'vite-plus'
import { cssImportEdge } from '../../scripts/build/css-import-edge.ts'

// Built with `vp build` (an explicit lib config) rather than `vp pack`, so it can carry
// the shared CSS-import-edge plugin and so the whole package family emits one module
// convention. `vp pack` emitted `.mjs`/`.d.mts` here while every sibling emitted
// `.js`/`.d.ts` — harmless in isolation, but it breaks tooling that assumes one convention
// across a package family (2026-07-28 report C8), and it left this the one CSS-shipping
// package whose stylesheet never reached the page (report C11).
export default defineConfig({
  plugins: [cssImportEdge('ai.css')],
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'ai',
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        '@preact/signals-react',
        '@cascivo/core',
        '@cascivo/i18n',
        '@cascivo/tokens',
      ],
      output: {
        // AI surfaces are signal-driven client components; preserve the directive
        // for RSC consumers.
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
