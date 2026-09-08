/**
 * Map what appears in a rendered email onto Can I email feature slugs.
 *
 * The matrix is keyed by slug (`css-flex-direction`, `html-table`), while a linter sees
 * CSS declarations, HTML elements and at-rules. Most of the mapping is mechanical —
 * `flex-direction` → `css-flex-direction` — so this module encodes the mechanical rule and
 * only enumerates the exceptions.
 *
 * An unmapped feature resolves to a slug that does not exist in the matrix, which
 * `verdict()` reports as unsupported. That is the safe direction: a property nobody
 * thought about fails the lint rather than passing it silently.
 */

/** CSS value functions and keywords that are gated on their own slug, not the property's. */
const VALUE_FEATURES: Record<string, string> = {
  oklch: 'css-modern-color',
  oklab: 'css-modern-color',
  lch: 'css-modern-color',
  lab: 'css-modern-color',
  'color-mix': 'css-function-color-mix',
  var: 'css-variables',
  calc: 'css-unit-calc',
  clamp: 'css-function-clamp',
  min: 'css-function-min',
  max: 'css-function-max',
  'light-dark': 'css-function-light-dark',
  'contrast-color': 'css-function-contrast-color',
}

/** Properties whose slug does not follow `css-<property>`. */
const PROPERTY_ALIASES: Record<string, string> = {
  'flex-direction': 'css-flex-direction',
  'row-gap': 'css-gap',
  'column-gap': 'css-gap',
  'grid-template-columns': 'css-display-grid',
  'grid-template-rows': 'css-display-grid',
  'grid-template-areas': 'css-display-grid',
  'padding-inline': 'css-border-inline-block-longhand',
  'padding-block': 'css-border-inline-block-longhand',
  'margin-inline': 'css-border-inline-block-longhand',
  'margin-block': 'css-border-inline-block-longhand',
  'inline-size': 'css-block-inline-size',
  'block-size': 'css-block-inline-size',
}

/** Units gated on their own slug. */
const UNIT_FEATURES: Record<string, string> = {
  rem: 'css-unit-rem',
  em: 'css-unit-em',
  ch: 'css-unit-ch',
  vh: 'css-unit-vh',
  vw: 'css-unit-vw',
  vmin: 'css-unit-vmin',
  vmax: 'css-unit-vmax',
  pt: 'css-unit-pt',
  pc: 'css-unit-pc',
  cm: 'css-unit-cm',
  mm: 'css-unit-mm',
  in: 'css-unit-in',
  ex: 'css-unit-ex',
}

/** `display: flex` is a value, not a property — the slug depends on the value. */
const DISPLAY_VALUES: Record<string, string> = {
  flex: 'css-display-flex',
  'inline-flex': 'css-display-flex',
  grid: 'css-display-grid',
  'inline-grid': 'css-display-grid',
  none: 'css-display-none',
}

export function propertySlug(property: string): string {
  const p = property.trim().toLowerCase()
  return PROPERTY_ALIASES[p] ?? `css-${p}`
}

/** Slugs implied by a declaration's *value* — functions, units, and `display` keywords. */
export function valueSlugs(property: string, value: string): string[] {
  const slugs = new Set<string>()
  const v = value.toLowerCase()

  if (property.trim().toLowerCase() === 'display') {
    const slug = DISPLAY_VALUES[v.trim()]
    if (slug) slugs.add(slug)
  }

  for (const [fn, slug] of Object.entries(VALUE_FEATURES)) {
    if (new RegExp(`(^|[^\\w-])${fn}\\(`).test(v)) slugs.add(slug)
  }

  for (const [unit, slug] of Object.entries(UNIT_FEATURES)) {
    if (new RegExp(`\\d${unit}\\b`).test(v)) slugs.add(slug)
  }

  return [...slugs]
}

/** At-rules. `@media (prefers-color-scheme: …)` has its own slug, distinct from `@media`. */
export function atRuleSlug(rule: string, prelude = ''): string {
  const r = rule.replace(/^@/, '').trim().toLowerCase()
  if (r === 'media') {
    if (/prefers-color-scheme/.test(prelude)) return 'css-at-media-prefers-color-scheme'
    if (/prefers-reduced-motion/.test(prelude)) return 'css-at-media-prefers-reduced-motion'
    if (/hover/.test(prelude)) return 'css-at-media-hover'
    if (/orientation/.test(prelude)) return 'css-at-media-orientation'
    return 'css-at-media'
  }
  if (r === 'supports') return 'css-at-supports'
  if (r === 'import') return 'css-at-import'
  if (r === 'font-face') return 'css-at-font-face'
  if (r === 'keyframes') return 'css-at-keyframes'
  return `css-at-${r}`
}

export function elementSlug(tag: string): string {
  return `html-${tag.trim().toLowerCase()}`
}
