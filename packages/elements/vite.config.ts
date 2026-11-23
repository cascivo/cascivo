import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/*
 * `@cascivo/i18n` imports `signal` from `@preact/signals-react`, which re-exports it from
 * `@preact/signals-core` but also loads React. Pointing it at signals-core keeps React out of
 * the bundle and gives i18n and the elements one signal graph (locale changes re-render).
 * `import.meta.resolve`, not `require.resolve`: the ESM build, or the graph holds two copies.
 * Tests resolve both workspace packages to source so they need no prior build.
 */
const signalsCore = fileURLToPath(import.meta.resolve('@preact/signals-core'))
const alias = [
  { find: /^@preact\/signals-(react|core)$/, replacement: signalsCore },
  { find: /^@cascivo\/core\/pure$/, replacement: src('../core/src/pure.ts') },
  { find: /^@cascivo\/css$/, replacement: src('../css/src/index.ts') },
  { find: /^@cascivo\/i18n$/, replacement: src('../i18n/src/index.ts') },
]

export default defineConfig({
  resolve: { alias },
  build: {
    lib: {
      // One entry per element (no barrel) so a page loads only what it uses; Rolldown splits the shared
      // runtime (signals-core, i18n, base) into a common chunk. `elements:check` measures it.
      entry: {
        menu: './src/menu.ts',
        tabs: './src/tabs.ts',
        combobox: './src/combobox.ts',
        'date-picker': './src/date-picker.ts',
        dialog: './src/dialog.ts',
        toaster: './src/toaster.ts',
        htmx: './src/htmx.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      // `builtin.ts` registers its `de` catalogs as module side effects, so without this the
      // whole builtin catalog (~8 KB gz) ships although nothing here imports it. The elements
      // declare their own messages under the same keys (src/messages.ts).
      treeshake: { moduleSideEffects: (id: string) => !id.includes('/i18n/src/') },
      // Plain minify: the shared MINIFY keeps function names for React's dev warnings, which
      // no custom element produces; here every byte counts against the 3 KB budget.
      output: { minify: true },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
