import { lineOf } from './jsx-props.js'

export interface VendorCssFinding {
  file: string
  line: number
  specifier: string
  level: 'warn'
  rule: 'vendor-css-import'
  message: string
}

// `import '<spec>'` or `import x from '<spec>'` where <spec> ends in .css
// (optionally with a ?query / #hash). Captures the specifier.
const CSS_IMPORT_RE = /import\s+(?:[^'"]*?\bfrom\s+)?(['"])([^'"]+\.css(?:[?#][^'"]*)?)\1/g

/** A bare specifier resolves into node_modules (not a relative or absolute path). */
function isBareSpecifier(spec: string): boolean {
  return !spec.startsWith('.') && !spec.startsWith('/')
}

const MESSAGE =
  'CSS imported from a package through JS/TS cannot be wrapped in an @layer, so if this ' +
  'package ships unlayered global CSS it beats every cascivo layer. Route it through a CSS ' +
  'file instead: `@import url("<pkg>/styles.css") layer(vendor);`. See docs/THIRD-PARTY-CSS.md.'

/**
 * Warn on bare (node_modules) `*.css` imports in JS/TS. Relative imports (the
 * consumer's own CSS modules) and cascivo's own already-layered `@cascivo/*`
 * stylesheets are exempt. Level `warn` — teaches the layer(vendor) recipe.
 */
export function findVendorCssImports(source: string, filename: string): VendorCssFinding[] {
  const findings: VendorCssFinding[] = []
  for (const m of source.matchAll(CSS_IMPORT_RE)) {
    const spec = m[2]
    if (spec === undefined) continue
    if (!isBareSpecifier(spec)) continue
    // cascivo's own stylesheets ship the layer statement + fully-layered rules.
    if (spec.startsWith('@cascivo/')) continue
    findings.push({
      file: filename,
      line: lineOf(source, m.index ?? 0),
      specifier: spec,
      level: 'warn',
      rule: 'vendor-css-import',
      message: MESSAGE,
    })
  }
  return findings
}
