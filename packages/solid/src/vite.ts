import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { classes } from '@cascivo/css'
import solid from 'vite-plugin-solid'
import { inlineClasses } from './inline-classes.ts'

export interface CascivoSolidOptions {
  /** Island entries: output name -> source file (relative to the Vite root). `{ cart: 'src/cart.tsx' }` emits `cart.js`. */
  islands: Record<string, string>
  /** Directory the cascivo-web/cascivo-server template links `/assets/<name>.{js,css}` from. Default `assets`. */
  assetsDir?: string
}

/**
 * Vite preset for Solid islands: vite-plugin-solid plus the build shape the island loader
 * expects. One `<name>.js` per island with fixed names (no hash; link them from the template or
 * the Vite manifest), a single stylesheet named after the first island (`cssCodeSplit: false`), and no shared entry
 * signature kept strict so the island's default export survives tree-shaking.
 * Source aliases for `@cascivo/*` stay the app's business (see CLAUDE.md "Vite aliases").
 */
export function cascivoSolid(options: CascivoSolidOptions): Plugin[] {
  const preset: Plugin = {
    name: 'cascivo-solid',
    config(config) {
      const root = config.root ?? process.cwd()
      const input = Object.fromEntries(
        Object.entries(options.islands).map(([name, file]) => [name, resolve(root, file)]),
      )
      // The first island owns the one extracted stylesheet, so its name stays predictable.
      const cssName = Object.keys(input)[0]
      return {
        build: {
          cssCodeSplit: false,
          ...(options.assetsDir === undefined ? {} : { assetsDir: options.assetsDir }),
          rollupOptions: {
            input,
            preserveEntrySignatures: 'strict',
            output: {
              minify: { mangle: true, compress: true, codegen: { removeWhitespace: true } },
              entryFileNames: '[name].js',
              chunkFileNames: 'chunks/[name]-[hash].js',
              assetFileNames: (a: { names: string[] }) =>
                a.names.some((n) => n.endsWith('.css')) ? `${cssName}.css` : '[name][extname]',
            },
          },
        },
      }
    },
  }
  // Before the Solid transform so it sees plain string attributes.
  const inline: Plugin = {
    name: 'cascivo-solid:classes',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.[jt]sx?$/.test(id.split('?')[0] ?? '') || id.includes('/node_modules/')) return null
      const out = inlineClasses(code, classes)
      return out === undefined ? null : { code: out, map: null }
    },
  }
  return [inline, solid({ ssr: false }), preset]
}
