/**
 * SSR-import guard — prove the published `@cascivo/react` dist really has the
 * problem the SSR docs are written against.
 *
 * The docs (COMPATIBILITY.md, USING-WITH-VITE-SSR.md, …) tell adopters to mark
 * `@cascivo/*` `ssr.noExternal` because the per-component chunks ship their CSS
 * as bare side-effect imports (`import './button.css'`) that a raw server-side
 * ESM loader cannot resolve (`ERR_UNKNOWN_FILE_EXTENSION`). This test asserts
 * that contract on the actual built dist, so if a future dist change removes the
 * injected CSS edge (e.g. someone lands the parent plan's "Option A"), it fails
 * and forces the docs to be updated in lockstep.
 *
 * Requires `@cascivo/react` to be built. When `packages/react/dist` is absent
 * the assertions skip (a cold `node --test` must not fail spuriously); CI runs
 * this AFTER the build step so the dist always exists there.
 */

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(REPO_ROOT, 'packages/react/dist')
const distMissing = !existsSync(DIST)

/** Recursively collect `*.module.js` chunks under the built dist. */
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

describe('ssr-import — the built @cascivo/react dist ships bare CSS imports', () => {
  it('at least one dist chunk carries a bare `import "./x.css"`', { skip: distMissing }, () => {
    const shims = collectModuleShims(DIST)
    assert.ok(shims.length > 0, `no *.module.js chunks under ${DIST} — build broken?`)
    const withCss = shims.filter((f) => BARE_CSS_IMPORT.test(readFileSync(f, 'utf8')))
    assert.ok(
      withCss.length > 0,
      'No dist chunk carries a bare `import "./x.css"`. The SSR docs (ssr.noExternal recipe) ' +
        'assume this injected edge exists; if the dist stopped shipping it, update the SSR docs ' +
        'in lockstep (see packages/react/vite.config.ts cssImportEdges).',
    )
  })

  it(
    'raw-Node import of a CSS-bearing chunk throws ERR_UNKNOWN_FILE_EXTENSION',
    { skip: distMissing },
    () => {
      const shims = collectModuleShims(DIST)
      const chunk = shims.find((f) => BARE_CSS_IMPORT.test(readFileSync(f, 'utf8')))
      assert.ok(chunk, 'expected a CSS-bearing chunk to probe')
      // Node's bare ESM loader cannot handle the `.css` side-effect import — the
      // literal adopter error. This proves the *problem*; the fix is a
      // Vite-build-time behavior verified by apps/examples/react-vite-ssr.
      const res = spawnSync(
        process.execPath,
        ['--input-type=module', '-e', `import(${JSON.stringify(chunk)})`],
        { encoding: 'utf8' },
      )
      assert.notEqual(res.status, 0, 'expected raw-Node import of a CSS-bearing chunk to fail')
      assert.match(
        res.stderr,
        /ERR_UNKNOWN_FILE_EXTENSION|Unknown file extension "\.css"/,
        `expected the .css loader error, got:\n${res.stderr}`,
      )
    },
  )
})
