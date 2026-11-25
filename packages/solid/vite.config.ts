import { defineConfig } from 'vite-plus'
import solid from 'vite-plugin-solid'
import { MINIFY } from '../../scripts/build/minify.ts'

export default defineConfig({
  plugins: [solid({ ssr: false })],
  resolve: { conditions: ['browser'] },
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        vite: './src/vite.ts',
        // Types only (JSX augmentation); the empty module keeps the `exports` entry resolvable.
        elements: './src/cv-elements.ts',
        testing: './src/testing.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      // Peers and deps stay external: the adopter's Solid compiler and one Solid runtime.
      external: [/^solid-js($|\/)/, 'vite-plugin-solid', '@cascivo/css', /^node:/],
      output: { minify: MINIFY },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    server: { deps: { inline: [/solid-js/] } },
  },
})
