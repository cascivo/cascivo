import { resolve } from 'node:path'
import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  resolve: {
    alias: {
      '@cascivo/react': resolve(__dirname, '../react/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: { index: './src/index.ts', 'view-text': './src/view-text.ts' },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Subpath-aware, like the rest of the family: an exact string misses `react-dom/server`
      // and `@cascivo/core/pure`, which would then be bundled in.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        '@preact/signals-react',
        /^@cascivo\/core($|\/)/,
        /^@cascivo\/i18n($|\/)/,
        /^@cascivo\/react($|\/)/,
        /^@cascivo\/text($|\/)/,
      ],
      output: { minify: MINIFY },
    },
  },
  test: {
    environment: 'jsdom',
  },
})
