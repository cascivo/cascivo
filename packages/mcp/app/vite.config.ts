import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../../scripts/build/minify.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = resolve(here, '../../..')

// Builds app/view.tsx into dist-app/ as one ES module plus one stylesheet;
// scripts/build-app.mjs inlines both into dist/view.html.
export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: {
    alias: {
      // Workspace sources, so this build needs no other package built first. Subpaths first:
      // a string alias replaces by prefix.
      '@cascivo/core/pure': resolve(root, 'packages/core/src/pure.ts'),
      '@cascivo/core': resolve(root, 'packages/core/src/index.ts'),
      '@cascivo/i18n/locales': resolve(root, 'packages/i18n/src/locales'),
      '@cascivo/i18n': resolve(root, 'packages/i18n/src/index.ts'),
      '@cascivo/render/text': resolve(root, 'packages/render/src/view-text.ts'),
      '@cascivo/render': resolve(root, 'packages/render/src/index.ts'),
      '@cascivo/react': resolve(root, 'packages/react/src/index.ts'),
    },
  },
  build: {
    outDir: resolve(here, '../dist-app'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(here, 'view.tsx'),
      formats: ['es'],
      fileName: () => 'view.js',
      cssFileName: 'view',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true, minify: MINIFY },
      // Aliased to source, @cascivo/react loses its package.json `sideEffects: ['**/*.css']`,
      // and every component module would be kept. Restate it: only stylesheets have effects.
      treeshake: { moduleSideEffects: (id) => id.endsWith('.css') },
    },
  },
})
