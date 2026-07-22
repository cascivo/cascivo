import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

// The canonical @layer order statement (single source of truth). Prepended to the
// aggregate styles.css so a consumer who imports only '@cascivo/react/styles.css'
// still gets a deterministic cascade order; identical statements are idempotent, so
// this is harmless when @cascivo/themes is also loaded.
const LAYER_ORDER = readFileSync(
  fileURLToPath(new URL('../tokens/src/layers.css', import.meta.url)),
  'utf8',
).trim()

/**
 * Per-component CSS shipping.
 *
 * The build preserves the module graph (one .js per component instead of one
 * bundle) and code-splits CSS (one .module.css per component). That alone is
 * not enough: Vite's CSS-Modules transform turns each `*.module.css` into a
 * `*.module.js` shim holding only the class-name map and emits the stylesheet
 * as an orphaned asset with no import edge — so a consumer importing `Button`
 * would get no CSS.
 *
 * This plugin reconnects each stylesheet to its shim by injecting a side-effect
 * import. Two details make tree-shaking actually work across bundlers:
 *
 *  1. The emitted stylesheet is renamed `x.module.css` -> `x.css`. A *bare*
 *     import of a `.module.css` is read by Rolldown (Vite) as an unused
 *     CSS-Module binding and dropped — so the CSS would silently vanish from a
 *     consumer's Vite build. A plain `.css` is a true side-effect import and is
 *     preserved. (webpack tolerates either; this keeps both happy.)
 *  2. The import is injected after the chunk's `'use client'` directive
 *     prologue — directives must stay at the very top of the module.
 *
 * Because the shim is imported by the component and `sideEffects: ["**\/*.css"]`
 * is set, a consumer's bundler pulls in CSS only for the components actually
 * imported — and tree-shakes the rest. No manual stylesheet import required.
 *
 * SSR-safe twin (`dist/node/`). The per-component `.css` side-effect imports
 * make the browser build unloadable by a bare Node ESM loader — the default
 * state of an externalized dependency in every Vite SSR framework, which throws
 * `ERR_UNKNOWN_FILE_EXTENSION` on the first request. To make `import
 * '@cascivo/react'` work under bare Node with zero consumer config, this plugin
 * also emits a second, CSS-free copy of the whole module graph under
 * `dist/node/`, selected by the `node` export condition (see package.json). It
 * is byte-identical to the browser build minus the injected `.css` edges, so the
 * server renders correct HTML (CSS never applies server-side anyway) while the
 * client build — reached via the `import`/`browser` conditions — still carries
 * per-component CSS and tree-shakes it. The relative import graph is preserved,
 * so the copied tree resolves within itself.
 */
function cssImportEdges() {
  const directive = /^\s*(['"])use [\w-]+\1;?\s*$/
  // A bare relative CSS side-effect import, e.g. `import './spinner.css';`.
  const cssImportLine = /^\s*import\s+['"][^'"]*\.css['"];?\s*$/

  /** Drop every bare `.css` side-effect import line — the node twin has no CSS. */
  function stripCssImports(code: string): string {
    return code
      .split('\n')
      .filter((line) => !cssImportLine.test(line))
      .join('\n')
  }

  // Re-emit the leading directive prologue with duplicates collapsed, then
  // splice `inject` in immediately after it. Directives ('use client') must
  // stay at the very top of the module, so injected imports cannot precede them.
  function spliceAfterDirectives(code: string, inject: string): string {
    const lines = code.split('\n')
    const prologue: string[] = []
    const seen = new Set<string>()
    let i = 0
    for (; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === '') {
        prologue.push(line)
        continue
      }
      if (!directive.test(line)) break
      const key = line.trim().replace(/['"]/g, '')
      if (!seen.has(key)) {
        seen.add(key)
        prologue.push(line)
      }
    }
    const body = lines.slice(i).join('\n')
    return [...prologue, inject, body].join('\n')
  }

  return {
    name: 'cascivo:css-import-edges',
    generateBundle(
      _options: unknown,
      bundle: Record<string, { type: string; code?: string; source?: string | Uint8Array }>,
    ) {
      const cssSources: string[] = []
      for (const fileName of Object.keys(bundle).sort()) {
        const asset = bundle[fileName]
        // Component stylesheets are renamed to plain `.css` by assetFileNames
        // below; the aggregate styles.css is emitted at the end, not scanned.
        if (asset.type !== 'asset' || !fileName.endsWith('.css') || fileName === 'styles.css') {
          continue
        }
        if (typeof asset.source === 'string') cssSources.push(asset.source)
        // Shim that owns this stylesheet's class-name map (x.module.js).
        const jsName = fileName.replace(/\.css$/, '.module.js')
        const chunk = bundle[jsName]
        if (!chunk || chunk.type !== 'chunk' || typeof chunk.code !== 'string') continue
        const basename = fileName.slice(fileName.lastIndexOf('/') + 1)
        chunk.code = spliceAfterDirectives(chunk.code, `import './${basename}';`)
      }
      // Aggregate stylesheet for consumers without a bundler (CDN / plain
      // <link>) and for those who prefer a single explicit import. Bundler
      // users never touch this — their CSS rides along with each component
      // import and tree-shakes. All component CSS lives in @layer
      // cascivo.component, so concatenation order is not significant.
      this.emitFile({
        type: 'asset',
        fileName: 'styles.css',
        source: `${LAYER_ORDER}\n${cssSources.join('\n')}`,
      })
      // Flat package entry. preserveModulesRoot ('../components/src') pushes the
      // real entry to dist/react/src/index.js, outside the dist root — a subtree
      // that doesn't parallel the flat dist/index.d.ts and trips publint/attw. A
      // one-line re-export at dist/index.js lets the exports map point import and
      // types at parallel, top-level files. No default export exists, so `export *`
      // is complete.
      this.emitFile({
        type: 'asset',
        fileName: 'index.js',
        source: "'use client';\nexport * from './react/src/index.js';\n",
      })
      // Collapse the duplicate 'use client' (source directive + banner) in
      // component chunks that did not receive a CSS import above.
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName]
        if (chunk.type !== 'chunk' || typeof chunk.code !== 'string') continue
        if (!chunk.code.includes('use client')) continue
        chunk.code = spliceAfterDirectives(chunk.code, '').replace(/\n\n\n+/g, '\n\n')
      }
      // SSR-safe twin under dist/node/: every chunk copied verbatim with its
      // `.css` side-effect imports stripped, plus a matching flat entry. The
      // node build is selected by the `node` export condition and can be loaded
      // by a bare Node ESM loader (no `.css` specifiers to choke on). Emitted
      // after the browser chunks are finalized so the two builds differ only by
      // the CSS edges.
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName]
        if (chunk.type !== 'chunk' || typeof chunk.code !== 'string') continue
        this.emitFile({
          type: 'asset',
          fileName: `node/${fileName}`,
          source: stripCssImports(chunk.code),
        })
      }
      this.emitFile({
        type: 'asset',
        fileName: 'node/index.js',
        source: "'use client';\nexport * from './react/src/index.js';\n",
      })
    },
  }
}

export default defineConfig({
  plugins: [cssImportEdges()],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
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
        // One file per component so consumers tree-shake unused components +
        // their CSS, instead of pulling the whole library from a single bundle.
        preserveModules: true,
        preserveModulesRoot: '../components/src',
        entryFileNames: '[name].js',
        // Strip the `.module` infix from component stylesheets: a bare import of
        // a `.module.css` is dropped by Rolldown as an unused CSS-Module binding
        // (see cssImportEdges header). Plain `.css` survives as a side effect.
        assetFileNames: (info: { names?: string[] }) => {
          const name = info.names?.[0] ?? ''
          if (name.endsWith('.module.css')) return name.replace(/\.module\.css$/, '.css')
          return '[name][extname]'
        },
        // Components are client components; preserve the directive for RSC consumers.
        banner: "'use client';",
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setup.ts'],
  },
})
