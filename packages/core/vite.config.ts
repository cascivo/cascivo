import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      // Two entries: the full runtime, and the server-safe subset. See src/pure.ts.
      entry: { index: './src/index.ts', pure: './src/pure.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        // 23 source modules carry `'use client'`; the bundler collapses them into one entry
        // and drops per-module directives, so without this banner Next.js RSC treats every
        // hook and Portal/Slot as a SERVER component. Every sibling lib build carries it.
        //
        // `pure` is the deliberate exception: it exists precisely so a Server Component can
        // reach `cn`/`Slot`/`normalizeTone` without crossing a client boundary, so banning
        // the banner there is the whole point. Shared chunks are left bare too — they hold
        // only the code both entries import, which is by construction the pure subset; the
        // client entry carries its own directive and that is what marks its consumers.
        banner: (chunk: { name?: string; isEntry?: boolean }) =>
          chunk.isEntry && chunk.name === 'index' ? "'use client';" : '',
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
