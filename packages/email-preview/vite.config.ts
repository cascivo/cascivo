import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import { cascivoEmailPreview } from './src/plugin.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../..')

/**
 * The in-repo config. The published tool does not use it — `bin/cascivo-email-preview.mjs`
 * builds its own config so an adopter needs no file of their own — but `vp build` and
 * `vp dev` here do, and both need the same virtual modules the bin supplies.
 *
 * With no template directory the plugin serves the built-in templates, which is what a
 * contributor running the dev server wants to see.
 */
const vendored = resolve(__dirname, 'vendor/caniemail.json')
const caniemail = existsSync(vendored)
  ? vendored
  : resolve(root, 'scripts/email/vendor/caniemail.json')

export default defineConfig({
  server: { port: 4190, strictPort: true },
  plugins: [cascivoEmailPreview({ caniemail: existsSync(caniemail) ? caniemail : null })],
  resolve: {
    alias: {
      // Source alias so the app builds without a prior `pnpm build` — the same rule
      // CLAUDE.md states for every workspace package whose exports point at ./dist.
      '@cascivo/email': resolve(root, 'packages/email/src/index.ts'),
    },
  },
})
