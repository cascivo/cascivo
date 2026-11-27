import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cascivoSolid } from '@cascivo/solid/vite'
import { defineConfig } from 'vite-plus'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')

// Fixed names: the axum server links /assets/{live,htmx,elements}.js and /assets/live.css.
export default defineConfig({
  plugins: [
    cascivoSolid({
      islands: { live: 'src/live.tsx', htmx: 'src/htmx.ts', elements: 'src/elements.ts' },
    }),
  ],
  resolve: {
    alias: [
      // Source aliases for the JS entries only (not needed when installing from npm).
      { find: /^@cascivo\/css$/, replacement: resolve(root, 'packages/css/src/index.ts') },
      { find: /^@cascivo\/solid\/vite$/, replacement: resolve(root, 'packages/solid/src/vite.ts') },
      { find: /^@cascivo\/solid$/, replacement: resolve(root, 'packages/solid/src/index.ts') },
    ],
  },
})
