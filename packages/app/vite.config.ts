import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        api: './src/api.ts',
        sync: './src/sync.ts',
        'sync-server': './src/sync-server.ts',
        flags: './src/flags.ts',
        jobs: './src/jobs.ts',
        'jobs-server': './src/jobs-server.ts',
        uploads: './src/uploads.ts',
        'uploads-server': './src/uploads-server.ts',
        export: './src/export.ts',
        analytics: './src/analytics.ts',
        db: './src/db.ts',
        guard: './src/guard.ts',
        ses: './src/ses.ts',
        stripe: './src/stripe.ts',
        turnstile: './src/turnstile.ts',
        auth: './src/auth.ts',
        'auth-server': './src/auth-server.ts',
        oauth: './src/oauth.ts',
        'oauth-server': './src/oauth-server.ts',
        social: './src/social.ts',
        live: './src/live.ts',
        'live-server': './src/live-server.ts',
        vite: './src/vite.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Subpath-aware, like the rest of the family (see packages/storage/vite.config.ts).
      external: [
        /^node:/,
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@preact\/signals-react($|\/)/,
        /^@cascivo\//,
      ],
      output: {
        minify: MINIFY,
        // The bundler drops per-module directives. Only the router entry renders React, so
        // only it is a client module; `api` and `sync-server` run in Workers, `sync` holds
        // no components, `flags` runs on both sides, `jobs` and `uploads` run in the browser
        // and their `-server` twins in the Worker,
        // `export` in both, `analytics`, `db`, `guard`, `ses` and `stripe` in the Worker,
        // `turnstile`, `live` and `auth` in the browser, `live-server`, `auth-server` and
        // `oauth-server` in the Worker, `oauth` and `social` wherever `fetch` and WebCrypto
        // exist, and `vite` runs in Node (see packages/core/vite.config.ts).
        banner: (chunk: { name?: string; isEntry?: boolean }) =>
          chunk.isEntry && chunk.name === 'index' ? "'use client';" : '',
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
