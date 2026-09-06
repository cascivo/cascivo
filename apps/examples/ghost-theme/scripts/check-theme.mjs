#!/usr/bin/env node
/**
 * Turns docs/USING-WITH-GHOST.md from prose into a tested contract.
 *
 * The guide previously shipped `.hbs` snippets and a flatten recipe with nothing executing
 * either — the same shape of claim that made the Astro grade wrong for two majors. This
 * script asserts the three things that can actually break:
 *
 *   1. The flattened CSS resolves every bare `@import`. Ghost serves assets verbatim, so a
 *      surviving bare specifier is a 404 and an unstyled site, with no error anywhere.
 *   2. The cascade layer order survives flattening, and both `[data-theme]` scopes are
 *      present — the guide tells adopters to rely on both.
 *   3. `gscan`, GHOST'S OWN theme validator, reports no errors. That is what makes this a
 *      real theme rather than plausible-looking Handlebars.
 *
 * What it does NOT do: run Ghost and render a page. There is no headless Ghost in CI, so the
 * guide still says the templates are a validated recipe, not a rendered one.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const THEME = join(ROOT, 'theme')
const CSS = join(THEME, 'assets', 'css', 'cascivo.css')

const failures = []
const note = (m) => failures.push(m)

// ── 1. The flatten actually flattened ──────────────────────────────────────
if (!existsSync(CSS)) {
  console.error('ghost-theme: assets/css/cascivo.css is missing — run `pnpm build` first.')
  process.exit(1)
}
const css = readFileSync(CSS, 'utf8')

const bareImports = [...css.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
if (bareImports.length > 0) {
  note(
    `${bareImports.length} unresolved @import(s) survived the flatten, e.g. "${bareImports[0]}". ` +
      'Ghost serves assets verbatim, so each of these is a 404 and every --cascivo-* token ' +
      'is undefined at runtime.',
  )
}

// ── 2. Layer order + both themes ───────────────────────────────────────────
const seen = new Set()
const order = []
for (const m of css.matchAll(/@layer\s+([a-zA-Z0-9_.,\s-]+?)\s*[;{]/g)) {
  for (const name of m[1].split(',').map((n) => n.trim())) {
    if (name && !seen.has(name)) {
      seen.add(name)
      order.push(name)
    }
  }
}
const CANONICAL = [
  'cascivo.reset',
  'cascivo.base',
  'cascivo.tokens',
  'cascivo.component',
  'cascivo.theme',
]
const positions = CANONICAL.map((l) => order.indexOf(l))
if (positions.some((p) => p === -1)) {
  note(
    `the flattened CSS is missing canonical layers: ` +
      CANONICAL.filter((_, i) => positions[i] === -1).join(', ') +
      `. First-appearance order was: ${order.join(' < ') || '(none)'}`,
  )
} else if (positions.some((p, i) => i > 0 && p < positions[i - 1])) {
  note(
    `canonical layers appear out of order — layers take their position from FIRST ` +
      `appearance, so this changes which rules win. Got: ${order.join(' < ')}`,
  )
}

for (const theme of ['light', 'dark']) {
  if (!new RegExp(`\\[data-theme=['"]?${theme}['"]?\\]`).test(css)) {
    note(`no [data-theme=${theme}] rules in the flattened CSS — the theme toggle is inert.`)
  }
}

// The guide's core promise: the theme's own CSS names only tokens, never raw values.
const screen = readFileSync(join(THEME, 'assets', 'css', 'screen.css'), 'utf8')
const declarations = screen.replace(/\/\*[\s\S]*?\*\//g, '')
const rawColors = [
  ...declarations.matchAll(/:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|oklch\([^)]*\))/g),
]
if (rawColors.length > 0) {
  note(
    `screen.css hard-codes ${rawColors.length} color value(s), e.g. "${rawColors[0][1]}". ` +
      'This example exists to show a theme built entirely on --cascivo-* tokens; a raw color ' +
      'does not follow data-theme and breaks that claim.',
  )
}

// ── 3. Ghost's own validator ───────────────────────────────────────────────
let gscanErrors = null
try {
  const { check, format } = await import('gscan')
  const result = await check(THEME)
  const formatted = format(result, { checkedVersion: 'v5' })
  gscanErrors = formatted.results.error ?? []
  if (gscanErrors.length > 0) {
    for (const e of gscanErrors) {
      note(`gscan: ${e.rule ? String(e.rule).replace(/<[^>]+>/g, '') : (e.code ?? 'error')}`)
    }
  }
} catch (error) {
  note(
    `gscan could not run (${error instanceof Error ? error.message : String(error)}). ` +
      'Ghost’s own validator is what makes this a real theme rather than plausible-looking ' +
      'Handlebars, so this is a failure, not a skip.',
  )
}

if (failures.length > 0) {
  console.error('ghost-theme: FAILED\n  ' + failures.join('\n  '))
  process.exit(1)
}

console.log(
  `ghost-theme: OK — ${Math.round(css.length / 1024)} KB flattened, no bare @imports, ` +
    `canonical layer order, light + dark present, gscan reports 0 errors.`,
)
