import { defineConfig } from 'vite-plus'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Subpath-AWARE externals. Exact strings miss subpath imports like
      // `@preact/signals-react/runtime`; bundling those drags in CJS shims whose
      // `require()` crashes Next.js RSC prerendering. Harmless while a package built with
      // `vp pack` (which ignores this block); fatal the moment it builds with `vp build`.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@preact\/signals-react($|\/)/,
        /^@cascivo\//,
      ],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
