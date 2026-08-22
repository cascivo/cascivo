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
// The `cascivo.reset` floor must survive into the aggregate. It reaches every other
// entry path via index.css's `@import './reset.css'`, but THIS sheet strips imports —
// so the reset is inlined explicitly in vite.config.ts and this asserts it stayed.
// Without it, a consumer importing only styles.css renders on the browser's content-box
// default and every `width: 100%` + padding component overflows (2026-07-28 report C12).
if (!/@layer cascivo\.reset\s*\{/.test(css))
  fail('styles.css has no `@layer cascivo.reset` block — the reset floor was not inlined')
if (!/box-sizing:\s*border-box/.test(css))
  fail('styles.css sets no global box-sizing — the reset floor was not inlined')

// ── 2. quickstart banner in the published .d.ts ─────────────────────────────
const dts = readFileSync(join(DIST, 'index.d.ts'), 'utf8')
// `light-dark.css`, not `all.css`: the banner used to recommend the twelve-theme bundle and
// describe it as "light & dark", which had been wrong since 0.14.0 and handed every adopter
// roughly twice the CSS they needed (2026-08-22 report #21). This assertion is what kept the
// wrong line in place, so it now pins the corrected one.
for (const needle of ['@cascivo/themes/light-dark.css', '@cascivo/icons', '@cascivo/docs']) {
  if (!dts.includes(needle))
    fail(`index.d.ts quickstart banner is missing "${needle}" (WS-B) — did flatten-types drop it?`)
}

// The published surface must stay greppable: an agent reads this file with grep, and two
// bundler-emitted lines (a ~940-char core import, a ~7.2 kB export list naming all 197
// components) defeated it — every search matched the export line and dumped the whole thing
// (2026-08-22 report item 19). `flatten-types.mjs` explodes specifier lists one name per line.
const longest = dts.split('\n').reduce((n, l) => Math.max(n, l.length), 0)
if (longest > 500)
  fail(
    `index.d.ts has a ${longest}-char line — grep output becomes unreadable. ` +
      'flatten-types.mjs should be exploding specifier lists one name per line.',
  )

// ── 3. no $N alias leak ─────────────────────────────────────────────────────
const alias = dts.match(/\b[A-Za-z_]\w*\$\d+\b/)
if (alias)
  fail(`index.d.ts leaks an aliased type name "${alias[0]}" (WS-F) — dedupe the source type`)

console.log(
  '✓ check-styles-complete: styles.css complete, quickstart banner + no $N aliases in .d.ts',
)
