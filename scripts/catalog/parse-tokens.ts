/**
 * Token catalog parser.
 *
 * Extracts all `--cascivo-*` CSS custom properties from the token sources,
 * classifies each by layer (primitive | semantic | component), resolves
 * var() chains using the combined light-theme resolution map, and returns
 * a flat array of TokenEntry records.
 *
 * Layer classification rules:
 *   primitive — matches a core scale group + a numeric suffix (or named size
 *               suffix like xs/sm/md/lg/xl/2xl), plus font-stack tokens.
 *               Groups: gray, blue, green, red, orange, yellow, warm, space,
 *               radius, shadow, text, font (weight/family), leading, tracking,
 *               chart, duration, ease, z
 *   component — name contains a specific UI component identifier as a word
 *               segment: button, input, card, badge, modal, ring, shell,
 *               control, focus, overlay
 *   semantic  — everything else (color-accent, radius-base, motion-*, …)
 *
 * Resolution:
 *   Values are resolved by following var() chains up to a depth of 10.
 *   calc() expressions are kept as-is (not simplified).
 *   resolvesPerTheme is true when the final concrete value comes exclusively
 *   from the theme file (light.css) — i.e., the token is not defined in
 *   index.css at all.
 */

export interface TokenEntry {
  name: string
  value: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault: string | null
  resolvesPerTheme: boolean
  /** True unless this token is a backwards-compat alias of another (canonical) token. */
  canonical: boolean
  /** When this token is an alias, the canonical token name to prefer instead. */
  aliasOf?: string
}

// Canonical/alias map — MUST mirror scripts/tokens/generate-manifest.mjs ALIASES.
// Key = alias token, value = its canonical token. Kept here so the catalog
// (and every agent surface that reads it) can steer to the one correct name.
const ALIASES: Record<string, string> = {
  '--cascivo-color-bg': '--cascivo-color-background',
  '--cascivo-color-text': '--cascivo-color-foreground',
  '--cascivo-color-foreground-muted': '--cascivo-color-text-muted',
  '--cascivo-color-error': '--cascivo-color-destructive',
  '--cascivo-color-accent-content': '--cascivo-color-accent-foreground',
  '--cascivo-color-success-content': '--cascivo-color-success-foreground',
  '--cascivo-color-warning-content': '--cascivo-color-warning-foreground',
  '--cascivo-color-destructive-content': '--cascivo-color-destructive-foreground',
  '--cascivo-color-primary-content': '--cascivo-color-primary-fg',
}

// Primitive scale group names that use numeric or named-size suffixes.
const PRIMITIVE_SCALE_GROUPS = new Set([
  'gray',
  'blue',
  'green',
  'red',
  'orange',
  'yellow',
  'warm',
  'space',
  'radius',
  'shadow',
  'text',
  'font',
  'leading',
  'tracking',
  'chart',
  'duration',
  'ease',
  'z',
])

// Named size suffixes that count as primitive scale steps.
// Does NOT include "base" (that's a semantic knob, e.g. --cascivo-radius-base).
const NAMED_SIZES = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full', 'none'])

// Component-specific word segments that classify a token as component-layer.
const COMPONENT_SEGMENTS = new Set([
  'button',
  'input',
  'card',
  'badge',
  'modal',
  'ring',
  'shell',
  'control',
  'focus',
  'overlay',
])

/**
 * Extract all `--cascivo-*: <value>;` declarations from a CSS string.
 * Returns a Map of property name → raw value (trimmed, without trailing ;).
 * Handles multi-line values (e.g. font stacks, color-mix).
 */
export function extractDeclarations(css: string): Map<string, string> {
  const result = new Map<string, string>()
  // Match --cascivo-<name>: followed by any value up to the next ; or end of block.
  // We use a single-pass regex that captures multi-line values.
  const re = /(--cascivo-[\w-]+)\s*:\s*((?:[^;{}]|\n)*?);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    const name = m[1]!.trim()
    const value = m[2]!.trim().replace(/\s+/g, ' ')
    if (name.startsWith('--cascivo-')) {
      result.set(name, value)
    }
  }
  return result
}

/** Extract the group: segment between `--cascivo-` and the first subsequent `-`. */
function extractGroup(name: string): string {
  // name is like --cascivo-gray-500 or --cascivo-color-accent
  const body = name.slice('--cascivo-'.length) // "gray-500"
  const dash = body.indexOf('-')
  return dash === -1 ? body : body.slice(0, dash)
}

/** Classify a token name into its layer. */
function classifyLayer(name: string): 'primitive' | 'semantic' | 'component' {
  const body = name.slice('--cascivo-'.length) // e.g. "gray-500", "color-accent", "ring-width"
  const segments = body.split('-')

  // Component check: any segment matches a component identifier.
  for (const seg of segments) {
    if (COMPONENT_SEGMENTS.has(seg)) return 'component'
  }

  // Primitive check: group is a scale group and the last segment is numeric or a named size.
  const group = segments[0]!
  if (PRIMITIVE_SCALE_GROUPS.has(group)) {
    const last = segments[segments.length - 1]!
    // Numeric suffix (e.g. "500", "4", "100", "200")
    if (/^\d+$/.test(last)) return 'primitive'
    // Named size suffix — only for a bare 2-segment scale step (e.g. text-lg,
    // radius-xl). A 3+-segment token that merely ends in a size (text-heading-lg,
    // text-body-sm) is a semantic *role*, not a primitive scale step.
    if (NAMED_SIZES.has(last) && segments.length === 2) return 'primitive'
    // Font-stack tokens: --cascivo-font-sans, --cascivo-font-mono
    if (group === 'font' && (last === 'sans' || last === 'mono')) return 'primitive'
    // Single-segment ease tokens: --cascivo-ease-in, --cascivo-ease-out, --cascivo-ease-in-out
    if (group === 'ease') return 'primitive'
  }

  return 'semantic'
}

/**
 * Resolve a value by following var() chains.
 * Returns the concrete value and whether it was resolved via the theme map.
 */
function resolveValue(
  rawValue: string,
  indexMap: Map<string, string>,
  combinedMap: Map<string, string>,
  depth = 0,
): { resolved: string | null; usedTheme: boolean } {
  if (depth > 10) return { resolved: null, usedTheme: false }

  // Keep calc() as-is.
  if (rawValue.startsWith('calc(')) return { resolved: rawValue, usedTheme: false }

  // Simple var() reference (no fallback, no nested vars at top level).
  const simpleVar = /^var\((--cascivo-[\w-]+)\)$/.exec(rawValue)
  if (simpleVar) {
    const ref = simpleVar[1]!
    const refValue = combinedMap.get(ref)
    if (refValue === undefined) return { resolved: null, usedTheme: false }
    const inner = resolveValue(refValue, indexMap, combinedMap, depth + 1)
    // Mark as theme-sourced if the reference itself isn't in index.css.
    const usedTheme = !indexMap.has(ref) || inner.usedTheme
    return { resolved: inner.resolved, usedTheme }
  }

  // Concrete value (no var() at all): return it directly.
  if (!rawValue.includes('var(')) return { resolved: rawValue, usedTheme: false }

  // Complex value with embedded var() (e.g. color-mix, multi-token shadows): keep as-is.
  return { resolved: rawValue, usedTheme: false }
}

/**
 * Parse both CSS files and return a flat array of TokenEntry records.
 *
 * @param indexCss   Contents of packages/tokens/src/index.css
 * @param lightCss   Contents of packages/themes/src/light.css
 */
export function parseTokens(indexCss: string, lightCss: string): TokenEntry[] {
  const indexMap = extractDeclarations(indexCss)
  const lightMap = extractDeclarations(lightCss)

  // Combined resolution map: light.css values override index.css values.
  const combinedMap = new Map([...indexMap, ...lightMap])

  // Deduplicated token names in declaration order: index.css first, then new tokens from light.css.
  const seen = new Set<string>()
  const names: string[] = []
  for (const name of indexMap.keys()) {
    seen.add(name)
    names.push(name)
  }
  for (const name of lightMap.keys()) {
    if (!seen.has(name)) {
      names.push(name)
    }
  }

  return names.map((name) => {
    const rawValue = combinedMap.get(name)!
    const onlyInTheme = !indexMap.has(name)
    const { resolved, usedTheme } = resolveValue(rawValue, indexMap, combinedMap)
    const aliasOf = ALIASES[name]

    return {
      name,
      value: rawValue,
      layer: classifyLayer(name),
      group: extractGroup(name),
      resolvedDefault: resolved,
      resolvesPerTheme: onlyInTheme || usedTheme,
      canonical: !aliasOf,
      ...(aliasOf ? { aliasOf } : {}),
    }
  })
}
