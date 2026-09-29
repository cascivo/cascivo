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
        // no components, and `vite` runs in Node (see packages/core/vite.config.ts).
        banner: (chunk: { name?: string; isEntry?: boolean }) =>
          chunk.isEntry && chunk.name === 'index' ? "'use client';" : '',
      },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
