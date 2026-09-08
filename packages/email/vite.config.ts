import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Subpath-AWARE externals. An exact string misses `react-dom/server`, which is what
      // `renderEmail` imports; bundling it would drag React's whole server renderer into
      // this package. `packages/flow`'s config carries the same note for the same reason.
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        minify: MINIFY,
        // Deliberately NO `'use client'` banner. Email primitives use no hooks, no signals
        // and no client-only API — they are pure functions of props. Marking them as client
        // components would force a boundary on an RSC consumer for code that never runs in
        // a browser at all.
      },
    },
  },
  test: {
    // No jsdom: an email is rendered to a string and asserted as a string. Introducing a
    // DOM here would let a test pass on behaviour no email client has.
    environment: 'node',
  },
})
