import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cascivoSolid } from '@cascivo/solid/vite'
import { defineConfig } from 'vite-plus'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')

// One island bundle with fixed names: the axum server links /assets/island.{js,css}.
export default defineConfig({
  plugins: [
    cascivoSolid({
      islands: { island: 'src/island.tsx', htmx: 'src/htmx.ts', elements: 'src/elements.ts' },
    }),
  ],
  resolve: {
    alias: [
      // Source aliases for the JS entries only; `@cascivo/css/cascivo.css` resolves through the
      // package exports (its dist), as it does for an adopter. Not needed when installing from npm.
      { find: /^@cascivo\/css$/, replacement: resolve(root, 'packages/css/src/index.ts') },
      { find: /^@cascivo\/solid\/vite$/, replacement: resolve(root, 'packages/solid/src/vite.ts') },
      { find: /^@cascivo\/solid$/, replacement: resolve(root, 'packages/solid/src/index.ts') },
    ],
  },
})
