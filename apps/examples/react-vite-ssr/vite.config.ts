import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cascivoSsr } from '@cascivo/vite-plugin'
import { defineConfig } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')

export default defineConfig(({ isSsrBuild }) => ({
  // The recipe this example validates: `cascivoSsr()` marks @cascivo/* as
  // `ssr.noExternal` so Vite bundles the per-component CSS side-effect imports
  // during SSR instead of leaving them for a raw server-side loader to choke on
  // (`Unknown file extension ".css"`). Equivalent to `ssr: { noExternal:
  // [/^@cascivo\//] }`. This is the exact config an npm consumer copies.
  plugins: [cascivoSsr()],
  resolve: {
    alias: {
      // @cascivo/core and @cascivo/i18n are pure JS — aliasing to source avoids
      // needing their dist built and does not affect the CSS path. Do NOT alias
      // @cascivo/react: it must resolve to its built dist via the package
      // `exports` map, because the CSS-import edge only exists in the dist. An
      // alias here would make this example verify nothing (see readme.body.md).
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
    },
  },
  build: {
    // Split client vs server outputs so the two builds in the `build` script
    // don't clobber each other.
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    emptyOutDir: true,
  },
}))
