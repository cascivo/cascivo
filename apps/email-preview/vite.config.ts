import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../..')

export default defineConfig({
  server: { port: 4190, strictPort: true },
  resolve: {
    alias: {
      // Source alias so the app builds without a prior `pnpm build` — the same rule
      // CLAUDE.md states for every workspace package whose exports point at ./dist.
      '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/email': resolve(root, 'packages/email/src/index.ts'),
    },
  },
})
