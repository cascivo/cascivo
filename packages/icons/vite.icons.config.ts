import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

/**
 * Second, ADDITIVE build: one output module per icon, for `@cascivo/icons/icons/<Name>`.
 *
 * Tree-shaking off the barrel already works — a 2026-07-28 adopter verified 4 imported icons
 * produced 1 SVG path in the bundle — so these subpaths exist for consumers whose bundler
 * does not tree-shake well, and for agents that want a narrow, greppable import (report C8).
 *
 * Deliberately a SEPARATE config rather than extra entries on the main one. The primary
 * `vp pack src/index.tsx` output is left byte-for-byte untouched, so nothing about the
 * existing `@cascivo/icons` import path can regress — which matters here, because converting
 * this package's main build is exactly what broke Next.js RSC prerendering once already (see
 * the comment in `scripts/checks/pkg-exports.test.ts`).
 *
 * `emptyOutDir: false` because this runs AFTER the main build and must not wipe it.
 *
 * Entries come from `src/single/entries.json`, written by `scripts/icons/generate.mjs`, so
 * the icon list has exactly one source of truth.
 */
const entries = JSON.parse(
  readFileSync(fileURLToPath(new URL('./src/single/entries.json', import.meta.url)), 'utf8'),
) as string[]

export default defineConfig({
  build: {
    outDir: 'dist/icons',
    emptyOutDir: false,
    lib: {
      entry: Object.fromEntries(entries.map((name) => [name, `./src/single/${name}.tsx`])),
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
    },
  },
})
