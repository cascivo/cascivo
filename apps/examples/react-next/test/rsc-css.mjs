/**
 * RSC style-completeness test — the regression guard for the "SSR CSS bundle is huge" bug.
 *
 * The bug: React Server Components resolve a dependency with the `react-server` condition
 * and then `node`. `@cascivo/react` offered only `node`, which points at the CSS-free
 * `dist/node/` twin (that twin exists so a bare Node ESM loader can import the package
 * without `ERR_UNKNOWN_FILE_EXTENSION`). So every component WITHOUT a `'use client'`
 * directive — exactly the `clientJs: 'none'` ones, cascivo's whole RSC advantage — rendered
 * on the server from a build with no `.css` import edges, and Next never collected their
 * stylesheets. Six of the eleven hashed class names in this page's HTML had no rule
 * anywhere in the emitted CSS. Client components were unaffected: they are re-resolved by
 * the client bundler under browser conditions, which still sees the CSS.
 *
 * That silent hole was papered over by telling every SSR adopter to import the 328 KB
 * aggregate `@cascivo/react/styles.css`, which is why a one-card page shipped ~384 KB of
 * CSS. This file asserts the property directly, so the aggregate can stay out:
 *
 *   1. every hashed CSS-Module class name in the prerendered HTML has a matching rule in
 *      the emitted CSS — the assertion that actually fails when the condition regresses;
 *   2. the page's total CSS stays under budget — the assertion that fails if someone
 *      "fixes" (1) by importing the aggregate again.
 *
 * Needs a prior `next build` (`pnpm exec vp run @cascivo/example-react-next#build`).
 * See docs/plans/ssr-css-and-client-js-plan.md.
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Gzip-free ceiling for the whole page's CSS. Measured 34 KB; the aggregate alone is 302 KB. */
const CSS_BUDGET_BYTES = 60_000

const root = fileURLToPath(new URL('..', import.meta.url))
const appDir = `${root}.next/server/app`
const chunksDir = `${root}.next/static/chunks`

if (!existsSync(appDir) || !existsSync(chunksDir)) {
  console.error(
    `Next build output missing (${appDir}).\n` +
      'Run `pnpm exec vp run @cascivo/example-react-next#build` (or `pnpm build`) first.',
  )
  process.exit(1)
}

const html = readFileSync(`${appDir}/index.html`, 'utf8')
const cssFiles = readdirSync(chunksDir).filter((f) => f.endsWith('.css'))
const css = cssFiles.map((f) => readFileSync(`${chunksDir}/${f}`, 'utf8')).join('\n')

// Vite's CSS-Modules transform emits `_<name>_<hash>_<line>`, so every class in the HTML
// that matches this shape came from a cascivo component stylesheet.
const rendered = [
  ...new Set([...html.matchAll(/_[A-Za-z0-9]+_[a-z0-9]{4,6}_\d+/g)].map((m) => m[0])),
]
assert.ok(
  rendered.length >= 8,
  `expected the page to render cascivo component classes, found ${rendered.length} — ` +
    'the page or the class-name format changed and this test is no longer measuring anything',
)

const unstyled = rendered.filter((cls) => !css.includes(cls))
assert.deepEqual(
  unstyled,
  [],
  'These classes are in the server-rendered HTML but have no rule in any emitted ' +
    'stylesheet, so those components paint unstyled:\n  ' +
    `${unstyled.join('\n  ')}\n` +
    'Check that @cascivo/react\'s exports map still offers a "react-server" condition ' +
    'pointing at the CSS-bearing build, ahead of "node".',
)

const cssBytes = cssFiles.reduce((n, f) => n + readFileSync(`${chunksDir}/${f}`).byteLength, 0)
assert.ok(
  cssBytes <= CSS_BUDGET_BYTES,
  `page CSS is ${cssBytes} bytes, over the ${CSS_BUDGET_BYTES} budget. If this jumped by ` +
    '~300 KB, something re-added `import "@cascivo/react/styles.css"` — the aggregate is ' +
    'for no-bundler setups; under RSC the per-component CSS arrives through the module graph.',
)

console.log(
  `RSC CSS OK — ${rendered.length} rendered component classes all styled, ` +
    `${cssBytes} bytes of CSS across ${cssFiles.length} chunk(s).`,
)
