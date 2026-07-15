/**
 * @cascivo/vite-plugin — layer JS-imported vendor CSS.
 *
 * The native recipe (`@import url('lib.css') layer(vendor)` from a CSS file) is
 * the primary, tooling-free way to tame third-party stylesheets — see
 * docs/THIRD-PARTY-CSS.md. What native CSS cannot do is layer a stylesheet
 * imported from JavaScript (`import 'lib/styles.css'`), which is how most JS
 * libraries ship. This plugin closes exactly that gap: it wraps configured
 * node_modules `.css` imports into a low-priority `@layer` at build time so the
 * cascivo layers always win.
 */

/**
 * The subset of Vite's `Plugin` interface this package implements. Declared
 * structurally so the package doesn't require `vite`'s types to be resolvable;
 * the returned object is assignable to Vite's `Plugin`.
 */
export interface VitePlugin {
  name: string
  enforce?: 'pre' | 'post'
  transform?: (code: string, id: string) => { code: string; map: null } | null | undefined
}

export interface CascivoLayersOptions {
  /**
   * Map a stylesheet's module id (matched against the tail of the resolved id,
   * e.g. `"recharts/styles.css"`) to the cascade layer it should live in
   * (typically `"vendor"`). The layer must be declared before the cascivo
   * layers in your app's order statement — the scaffold from `cascivo create`
   * already includes a `vendor` slot.
   */
  imports: Record<string, string>
}

const IMPORT_RE = /@import\s+[^;]+;/g
const CHARSET_RE = /^\s*@charset\s+[^;]+;/i

/** Add `layer(<layer>)` to an `@import` statement that isn't already layered. */
function layerizeImport(stmt: string, layer: string): string {
  if (/\blayer\b/.test(stmt)) return stmt
  const head = stmt.match(/@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')/i)
  if (!head) return stmt
  return stmt.replace(head[0], `${head[0]} layer(${layer})`)
}

/**
 * Wrap a stylesheet's rules in `@layer <layer> { … }`. Because an `@import` may
 * not appear inside a layer block, top-level `@import`s are hoisted out and
 * rewritten to carry `layer(<layer>)` themselves; a leading `@charset` is kept
 * first. Pure string-in/string-out.
 */
export function wrapCssInLayer(source: string, layer = 'vendor'): string {
  let charset = ''
  let body = source
  const cm = body.match(CHARSET_RE)
  if (cm) {
    charset = `${cm[0].trim()}\n`
    body = body.slice(cm[0].length)
  }
  const imports: string[] = []
  body = body.replace(IMPORT_RE, (stmt) => {
    imports.push(layerizeImport(stmt.trim(), layer))
    return ''
  })
  const importsBlock = imports.length > 0 ? `${imports.join('\n')}\n` : ''
  return `${charset}${importsBlock}@layer ${layer} {\n${body.trim()}\n}\n`
}

/** Normalize a module id: drop the query/hash and Windows backslashes. */
function normalizeId(id: string): string {
  return (id.split('?')[0] ?? id).replace(/\\/g, '/')
}

/**
 * Vite plugin that wraps configured node_modules stylesheets in a cascade
 * `@layer`. Runs `enforce: 'pre'` so it transforms the raw CSS before Vite's
 * own CSS pipeline processes it.
 */
export function cascivoLayers(options: CascivoLayersOptions): VitePlugin {
  const entries = Object.entries(options?.imports ?? {})
  return {
    name: 'cascivo:vendor-layers',
    enforce: 'pre',
    transform(code, id) {
      const clean = normalizeId(id)
      if (!clean.endsWith('.css') || !clean.includes('node_modules')) return null
      const match = entries.find(([key]) => clean.endsWith(key))
      if (!match) return null
      return { code: wrapCssInLayer(code, match[1]), map: null }
    },
  }
}

export default cascivoLayers
