import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import type { Plugin } from 'vite-plus'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(__dirname, '../../..')
const preactCompat = resolve(__dirname, 'node_modules/preact/compat')
const preactJsxRuntime = resolve(__dirname, 'node_modules/preact/jsx-runtime')
const preactClient = resolve(__dirname, 'node_modules/preact/compat/client')

/**
 * Serves `/api/*` from the real Worker module inside the Vite dev server, with the mock AI
 * binding — one `pnpm dev`, no Cloudflare account. `pnpm dev:worker` runs the same Worker
 * in wrangler against real Workers AI.
 */
function workerApi(): Plugin {
  return {
    name: 'cascivo-chat:worker-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        try {
          const { default: worker } = (await server.ssrLoadModule(
            '/worker/index.ts',
          )) as typeof import('./worker/index')
          const { createMockAi } = (await server.ssrLoadModule(
            '/worker/mock-ai.ts',
          )) as typeof import('./worker/mock-ai')

          const init: RequestInit & { duplex?: 'half' } = {
            method: req.method ?? 'GET',
            headers: req.headers as Record<string, string>,
          }
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            init.body = Readable.toWeb(req) as ReadableStream<Uint8Array>
            init.duplex = 'half'
          }
          const response = await worker.fetch(new Request(`http://localhost${req.url}`, init), {
            AI: createMockAi(),
          })

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          if (!response.body) return res.end()
          const body = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream)
          req.on('close', () => body.destroy())
          body.pipe(res)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [workerApi()],
  server: {
    port: 4191,
    strictPort: true,
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
      // Source aliases so Rolldown doesn't need pre-built dist files.
      // Must precede the bare '@cascivo/core' entry: a string alias replaces by
      // prefix, so without this '@cascivo/core/pure' resolves to 'index.ts/pure'.
      '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/storage': resolve(root, 'packages/storage/src/index.ts'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
      '@cascivo/ai': resolve(root, 'packages/ai/src/index.ts'),
      '@cascivo/icons': resolve(root, 'packages/icons/src/index.tsx'),
      '@cascivo/example-kit': resolve(__dirname, '../kit/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
})
