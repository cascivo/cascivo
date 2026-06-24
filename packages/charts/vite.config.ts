import { createRequire } from 'node:module'
import { defineConfig } from 'vite-plus'

// Bridge the charts onto Preact exactly as the docs app does: alias react /
// react-dom to preact/compat (signals-react resolves its own `react` import
// through the same alias, so no signals mapping is needed). Resolve to absolute
// file paths so vite can rewrite the imports inside externalized dist files
// (e.g. @cascivo/core). Scoped to the preact test project below so the rest of
// the suite runs on real React.
const require = createRequire(import.meta.url)
const preactCompat = require.resolve('preact/compat')
const preactCompatClient = require.resolve('preact/compat/client')
const preactJsxRuntime = require.resolve('preact/jsx-runtime')
const preactSignals = require.resolve('@preact/signals')
const signalsRuntimeShim = require.resolve('./test/signals-runtime-shim.ts')
const preactAlias = [
  { find: /^react$/, replacement: preactCompat },
  { find: /^react-dom$/, replacement: preactCompat },
  { find: /^react-dom\/client$/, replacement: preactCompatClient },
  { find: /^react\/jsx-runtime$/, replacement: preactJsxRuntime },
  { find: /^react\/jsx-dev-runtime$/, replacement: preactJsxRuntime },
  // signal hooks → preact-native @preact/signals; the signals-react auto-track
  // runtime needs React internals absent on Preact, so useSignals() is no-op'd.
  { find: /^@preact\/signals-react\/runtime$/, replacement: signalsRuntimeShim },
  { find: /^@preact\/signals-react$/, replacement: preactSignals },
]

const PREACT_TEST = 'charts-preact-compat.test.tsx'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'charts',
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        '@preact/signals-react',
        '@cascivo/core',
        '@cascivo/i18n',
      ],
      output: {
        // Charts are signal-driven client components; preserve the directive
        // for RSC consumers.
        banner: "'use client';",
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'react',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/setup.ts'],
          include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
          exclude: ['**/node_modules/**', `**/${PREACT_TEST}`],
        },
      },
      {
        extends: true,
        resolve: { alias: preactAlias },
        test: {
          name: 'preact',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/setup.ts'],
          include: [`**/${PREACT_TEST}`],
        },
      },
    ],
  },
})
