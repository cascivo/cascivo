import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import solid from 'vite-plugin-solid'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')

// One island bundle with fixed names: the axum server links /assets/island.{js,css}.
export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: [
      // Source alias for the JS entry only; `@cascivo/css/cascivo.css` resolves through the
      // package exports (its dist), as it does for an adopter. Not needed when installing from npm.
      { find: /^@cascivo\/css$/, replacement: resolve(root, 'packages/css/src/index.ts') },
    ],
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        island: resolve(root, 'apps/examples/solid-htmx/src/island.tsx'),
        htmx: resolve(root, 'apps/examples/solid-htmx/src/htmx.ts'),
        elements: resolve(root, 'apps/examples/solid-htmx/src/elements.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (a) =>
          a.names.some((n) => n.endsWith('.css')) ? 'island.css' : '[name][extname]',
      },
      preserveEntrySignatures: false,
    },
  },
})
