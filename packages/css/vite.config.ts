import { defineConfig } from 'vite-plus'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  build: {
    lib: {
      entry: { index: './src/index.ts', vite: './src/vite.ts' },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: { minify: MINIFY },
    },
  },
  test: {
    environment: 'node',
  },
})
