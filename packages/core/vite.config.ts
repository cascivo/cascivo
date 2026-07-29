import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      output: {
        // 23 source modules carry `'use client'`; the bundler collapses them into one entry
        // and drops per-module directives, so without this banner Next.js RSC treats every
        // hook and Portal/Slot as a SERVER component. Every sibling lib build carries it.
        banner: "'use client';",
      },
      // Subpath-AWARE. Exact strings miss `@preact/signals-react/runtime`, which core
      // imports — bundling it drags in that package's CJS `use-sync-external-store` shim,
      // whose `require("react")` crashes Next.js RSC prerendering with "dynamic usage of
      // require is not supported". Harmless while this package built with `vp pack` (which
      // ignores this block); fatal the moment it builds with `vp build`.
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^@preact\/signals-react($|\/)/],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
