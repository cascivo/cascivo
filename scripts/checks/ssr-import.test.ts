/**
 * SSR-import guard — pin the two-build contract of the published `@cascivo/react`
 * dist.
 *
 * The browser build (reached via the `import`/`browser` export conditions) ships
 * per-component CSS as bare side-effect imports (`import './button.css'`) so a
 * consumer's bundler tree-shakes CSS per component. Those imports are unloadable
 * by a raw server-side ESM loader (`ERR_UNKNOWN_FILE_EXTENSION`) — which is why
 * the build ALSO emits a CSS-free twin under `dist/node/`, selected by the `node`
 * export condition, so `import '@cascivo/react'` works under bare Node (every
 * externalized Vite SSR framework) with zero consumer config.
 *
 * This test pins that contract on the actual built dist:
 *   1. the browser chunks still carry the injected `.css` edge (tree-shaking), and
 *   2. the `dist/node/` chunks carry NO `.css` import, and
 *   3. a raw-Node `import()` of the node entry SUCCEEDS.
 * If a future dist change breaks any of these (drops the browser CSS edge, or
 * regresses the node twin so SSR crashes again), it fails and forces the SSR
 * story to be revisited in lockstep. See packages/react/vite.config.ts
 * `cssImportEdges`.
 *
 * Requires `@cascivo/react` to be built. When `packages/react/dist` is absent the
 * assertions skip (a cold `node --test` must not fail spuriously); CI runs this
 * AFTER the build step so the dist always exists there.
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(REPO_ROOT, 'packages/react/dist')
const NODE_DIST = join(DIST, 'node')
const distMissing = !existsSync(DIST)

/** Recursively collect `*.module.js` chunks under `dir`. */
function collectModuleShims(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...collectModuleShims(full))
    else if (entry.endsWith('.module.js')) out.push(full)
  }
  return out
}

// A bare side-effect stylesheet import, e.g. `import './menubar.css';`. The
// import sits after the `'use client'` directive prologue, so match on source
// text, not on line 1.
const BARE_CSS_IMPORT = /import\s+['"]\.\/[^'"]+\.css['"]/

describe('ssr-import — @cascivo/react ships a browser build and a CSS-free node twin', () => {
  it(
    'the browser build carries the injected `import "./x.css"` edge (tree-shaking contract)',
    { skip: distMissing },
    () => {
      // Scan only the top-level browser tree, excluding the node/ twin.
      const shims = collectModuleShims(DIST).filter((f) => !f.startsWith(NODE_DIST))
      assert.ok(shims.length > 0, `no *.module.js chunks under ${DIST} — build broken?`)
      const withCss = shims.filter((f) => BARE_CSS_IMPORT.test(readFileSync(f, 'utf8')))
      assert.ok(
        withCss.length > 0,
        'No browser dist chunk carries a bare `import "./x.css"`. Per-component CSS ' +
          'tree-shaking depends on this injected edge (see packages/react/vite.config.ts ' +
          'cssImportEdges); if the dist stopped shipping it, the CSS delivery story changed.',
      )
    },
  )

  it('the node twin carries NO `.css` import', { skip: distMissing }, () => {
    assert.ok(existsSync(NODE_DIST), `expected the SSR-safe twin at ${NODE_DIST}`)
    const shims = collectModuleShims(NODE_DIST)
    assert.ok(shims.length > 0, `no *.module.js chunks under ${NODE_DIST} — node twin broken?`)
    const withCss = shims.filter((f) => BARE_CSS_IMPORT.test(readFileSync(f, 'utf8')))
    assert.equal(
      withCss.length,
      0,
      `node twin chunks must be CSS-free so a bare Node loader can import them; found ` +
        `${withCss.length} carrying a .css import:\n${withCss.slice(0, 5).join('\n')}`,
    )
  })

  it(
    'raw-Node import of the node entry succeeds (no ERR_UNKNOWN_FILE_EXTENSION)',
    { skip: distMissing },
    () => {
      const entry = join(NODE_DIST, 'index.js')
      assert.ok(existsSync(entry), `expected the node entry at ${entry}`)
      // The exact adopter path: a bare Node ESM loader importing the externalized
      // package during SSR. The node condition must let this load cleanly.
      const res = spawnSync(
        process.execPath,
        ['--input-type=module', '-e', `await import(${JSON.stringify(entry)})`],
        { encoding: 'utf8', cwd: REPO_ROOT },
      )
      assert.equal(
        res.status,
        0,
        `raw-Node import of the node entry must succeed, got exit ${res.status}:\n${res.stderr}`,
      )
      assert.doesNotMatch(
        res.stderr,
        /ERR_UNKNOWN_FILE_EXTENSION|Unknown file extension "\.css"/,
        `the SSR-safe node twin must not hit the .css loader error:\n${res.stderr}`,
      )
    },
  )
})
