// Post-build guards over the published @cascivo/react artifacts. Runs after
// `flatten-types.mjs` in the build script. Three invariants, each keyed to a
// cold-adopter failure mode:
//
//  1. WS-A1 — dist/styles.css is a COMPLETE stylesheet: it carries the token +
//     light/dark theme bundle, not just component structure. A consumer importing
//     only this one file must get a colored app, never the grayscale result of
//     component CSS with no --cascivo-* values behind it.
//  2. WS-B — dist/index.d.ts opens with the quickstart banner naming the themes
//     import and the sibling packages. This .d.ts is the documentation channel for
//     adopters who never reach npmjs.com/cascivo.com, so the quickstart must survive
//     the dts bundler (which drops the module-leading JSDoc — hence the banner inject).
//  3. WS-F — no `$N`-suffixed alias names leak into the published .d.ts. The dts
//     bundler renames duplicate private declarations (SpaceStep$3, Tag$1); those
//     suffixes surface in consumers' compiler errors. Public types must be singular
//     and exported so errors name them cleanly.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(fileURLToPath(new URL('..', import.meta.url)), 'dist')
const fail = (msg) => {
  console.error(`✗ check-styles-complete: ${msg}`)
  process.exit(1)
}

// ── 1. styles.css completeness ──────────────────────────────────────────────
const css = readFileSync(join(DIST, 'styles.css'), 'utf8')
if (!css.includes('@layer cascivo.theme'))
  fail('styles.css has no `@layer cascivo.theme` — the theme bundle was not inlined')
if (!/--cascivo-color-accent\s*:/.test(css))
  fail('styles.css defines no --cascivo-color-accent value — themes not inlined')
for (const t of ["[data-theme='light']", "[data-theme='dark']"]) {
  if (!css.includes(t)) fail(`styles.css has no ${t} block — default theme missing`)
}
// No real @import at-rule may remain (only legal before any rule; the word may
// still appear inside a comment, which is harmless — scan actual at-rule lines).
const strayImport = css.split('\n').find((l) => /^\s*@import\b/.test(l))
if (strayImport) fail(`styles.css still has an @import at-rule: ${strayImport.trim()}`)

// ── 2. quickstart banner in the published .d.ts ─────────────────────────────
const dts = readFileSync(join(DIST, 'index.d.ts'), 'utf8')
for (const needle of ['@cascivo/themes/all.css', '@cascivo/icons', '@cascivo/docs']) {
  if (!dts.includes(needle))
    fail(`index.d.ts quickstart banner is missing "${needle}" (WS-B) — did flatten-types drop it?`)
}

// ── 3. no $N alias leak ─────────────────────────────────────────────────────
const alias = dts.match(/\b[A-Za-z_]\w*\$\d+\b/)
if (alias)
  fail(`index.d.ts leaks an aliased type name "${alias[0]}" (WS-F) — dedupe the source type`)

console.log(
  '✓ check-styles-complete: styles.css complete, quickstart banner + no $N aliases in .d.ts',
)
