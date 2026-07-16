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
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

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

console.log(`SSR smoke OK — server-rendered ${html.length} bytes of cascivo markup.`)
