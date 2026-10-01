import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import type { Plugin } from 'vite-plus'
// Imported from source so this config works before @cascivo/app is built (a fresh clone).
import { cascivoRoutes } from '../../../packages/app/src/vite.ts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')
const preactCompat = resolve(__dirname, 'node_modules/preact/compat')
const preactJsxRuntime = resolve(__dirname, 'node_modules/preact/jsx-runtime')
const preactClient = resolve(__dirname, 'node_modules/preact/compat/client')

const WORKER_PORT = 8792

/**
 * `vp dev` also starts the Worker — Durable Objects and WebSockets included — in wrangler's
 * local runtime, and proxies `/api` to it. No Cloudflare account needed. wrangler stays out
 * of the lockfile (`npx`), like the repo's other Workers.
 *
 * The standalone copy in `starters/stage` uses `@cloudflare/vite-plugin` instead, which runs
 * the Worker inside Vite; it is not a workspace dependency because it pulls in workerd.
 */
function worker(): Plugin {
  return {
    name: 'cascivo-stage:worker',
    apply: 'serve',
    configureServer(server) {
      if (process.env['VITEST']) return
      // wrangler refuses to start while the assets directory is missing.
      mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
      const child = spawn(
        'npx',
        ['wrangler@4', 'dev', '--port', String(WORKER_PORT), '--ip', '127.0.0.1'],
        { cwd: __dirname, stdio: 'inherit' },
      )
      const stop = () => child.kill()
      server.httpServer?.once('close', stop)
      process.once('exit', stop)
    },
  }
}

export default defineConfig({
  plugins: [cascivoRoutes(), worker()],
  server: {
    port: 4192,
    strictPort: true,
    proxy: {
      '/api': { target: `http://127.0.0.1:${WORKER_PORT}`, ws: true },
    },
  },
  resolve: {
    alias: {
      // Preact compat. The subpaths come first: a string alias replaces by prefix, so a bare
      // 'react' entry above them would rewrite 'react/jsx-runtime' to 'compat/jsx-runtime'.
      'react-dom/client': preactClient,
      'react/jsx-runtime': preactJsxRuntime,
      'react/jsx-dev-runtime': preactJsxRuntime,
      react: preactCompat,
      'react-dom': preactCompat,
      // Source aliases so Rolldown doesn't need pre-built dist files. Subpaths precede their
      // bare entry: a string alias replaces by prefix.
      '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/data': resolve(root, 'packages/data/src/index.ts'),
      '@cascivo/app/api': resolve(root, 'packages/app/src/api.ts'),
      '@cascivo/app/sync-server': resolve(root, 'packages/app/src/sync-server.ts'),
      '@cascivo/app/sync': resolve(root, 'packages/app/src/sync.ts'),
      '@cascivo/app/guard': resolve(root, 'packages/app/src/guard.ts'),
      '@cascivo/app': resolve(root, 'packages/app/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/charts': resolve(root, 'packages/charts/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
    },
  },
  test: {
    environment: 'node',
  },
})
