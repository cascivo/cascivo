import { readdirSync } from 'node:fs'
import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

// One entry per shipped locale (`@cascivo/i18n/locales/<code>`), so an app pays only for the
// languages it imports. English is the message defaults and German ships in the core entry.
const locales = Object.fromEntries(
  readdirSync(new URL('./src/locales', import.meta.url))
    .filter((f) => /^[a-z]{2}\.ts$/.test(f))
    .map((f) => [`locales/${f.slice(0, -3)}`, `./src/locales/${f}`]),
)

export default defineConfig({
  build: {
    lib: {
      entry: { index: './src/index.ts', ...locales },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: { minify: MINIFY },
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
    environment: 'node',
  },
})
