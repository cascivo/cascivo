/**
 * SSR smoke test — the living proof for the "Vite SSR / TanStack Start" row in
 * docs/COMPATIBILITY.md.
 *
 * It imports the built server bundle (`dist/server/entry-server.js`, produced by
 * `vp build --ssr src/entry-server.tsx`) and server-renders a page of CSS-bearing
 * cascivo components (Menubar, Card, Button) through the real Vite SSR pipeline
 * with the `cascivoSsr()` plugin. The mere import of that bundle would throw
 * `Unknown file extension ".css"` if the per-component CSS side-effect imports
 * in the @cascivo/react dist had not been processed during the SSR build — so a
 * successful import + render is the end-to-end proof the docs claim.
 *
 * Crucially, this consumes @cascivo/react via its built dist (the package
 * `exports` map), NOT a source alias — the CSS-import edge only exists in the
 * dist, so a source alias would make this test vacuous (see readme.body.md).
 *
 * Scope note: this is a POSITIVE end-to-end check. The mechanism's negative
 * proof lives at two other levels because it cannot be reproduced in-repo (the
 * monorepo's workspace symlink makes @cascivo/react `noExternal` by default, so
 * toggling the plugin here changes nothing):
 *   - scripts/checks/ssr-import.test.ts — raw Node import of a dist chunk throws
 *     the `.css` loader error (proves the problem is real in the dist).
 *   - packages/vite-plugin/src/index.test.ts — cascivoSsr() emits the documented
 *     `ssr.noExternal` config (proves the fix is what the docs describe).
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Ungzipped ceiling for the whole client stylesheet. Measured 29 KB — the light+dark theme
 * bundle plus the three components on the page. The aggregate `@cascivo/react/styles.css`
 * alone is 328 KB, so this budget is what keeps it out: per-component CSS rides the client
 * module graph and tree-shakes, and Vite emits it as the render-blocking <link> that styles
 * the server-rendered first paint. See docs/plans/ssr-css-and-client-js-plan.md.
 */
const CSS_BUDGET_BYTES = 60_000

const BUNDLE = new URL('../dist/server/entry-server.js', import.meta.url)

if (!existsSync(fileURLToPath(BUNDLE))) {
  console.error(
    'SSR bundle missing: ' +
      fileURLToPath(BUNDLE) +
      '\nRun `pnpm exec vp run @cascivo/example-react-vite-ssr#build` (or `pnpm build`) first.',
  )
  process.exit(1)
}

// The import itself is the load-bearing assertion: an unprocessed `.css`
// side-effect import inside the bundled @cascivo/react dist would throw here.
const mod = await import(BUNDLE.href)
assert.equal(typeof mod.render, 'function', 'entry-server must export render()')

const html = mod.render()
assert.equal(typeof html, 'string', 'render() must return an HTML string')

// Correct component markup made it through server rendering.
assert.match(html, /role="menubar"/, 'expected the Menubar to server-render')
assert.match(html, /Get started/, 'expected the Button label to server-render')
assert.match(html, /data-theme="light"/, 'expected the themed root to server-render')

// The client build is what actually styles that markup: it emits one <link> carrying the
// CSS of exactly the components in the module graph. Assert both halves of that contract —
// nothing rendered is unstyled, and nothing unused rode along.
const ASSETS = fileURLToPath(new URL('../dist/client/assets', import.meta.url))
if (existsSync(ASSETS)) {
  const sheets = readdirSync(ASSETS).filter((f) => f.endsWith('.css'))
  const css = sheets.map((f) => readFileSync(`${ASSETS}/${f}`, 'utf8')).join('\n')

  // Vite's CSS-Modules transform emits `_<name>_<hash>_<line>` class names, so every match
  // in the server HTML came from a cascivo component stylesheet.
  const rendered = [
    ...new Set([...html.matchAll(/_[A-Za-z0-9]+_[a-z0-9]{4,6}_\d+/g)].map((m) => m[0])),
  ]
  assert.ok(
    rendered.length >= 3,
    `expected server-rendered cascivo component classes, found ${rendered.length} — the page ` +
      'or the class-name format changed and this assertion no longer measures anything',
  )
  const unstyled = rendered.filter((cls) => !css.includes(cls))
  assert.deepEqual(
    unstyled,
    [],
    `Server-rendered classes with no rule in the client CSS (they paint unstyled):\n  ${unstyled.join('\n  ')}`,
  )

  const bytes = sheets.reduce((n, f) => n + readFileSync(`${ASSETS}/${f}`).byteLength, 0)
  assert.ok(
    bytes <= CSS_BUDGET_BYTES,
    `client CSS is ${bytes} bytes, over the ${CSS_BUDGET_BYTES} budget. A ~330 KB jump means ` +
      'someone re-added `import "@cascivo/react/styles.css"` — the aggregate is for ' +
      'no-bundler setups, not for a bundled SSR app.',
  )
  console.log(
    `SSR CSS OK — ${rendered.length} rendered component classes all styled, ${bytes} bytes across ${sheets.length} sheet(s).`,
  )
}

console.log(`SSR smoke OK — server-rendered ${html.length} bytes of cascivo markup.`)
