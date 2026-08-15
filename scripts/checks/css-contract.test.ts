/**
 * CSS-contract guard — packages in one family must ship CSS the same way.
 *
 * `@cascivo/react` auto-loads styling through per-component CSS side-effect imports, so a
 * consumer imports nothing. `@cascivo/charts` declared the identical
 * `sideEffects: ["**\/*.css"]`, implying the identical mechanism, and its `dist/index.js`
 * never imported its `dist/charts.css` — the only mention of the stylesheet in the entry
 * was inside a JSDoc comment. Charts rendered unstyled, with no warning, until you found
 * `@cascivo/charts/styles.css` in the exports map (2026-07-28 report C11).
 *
 * That is Mechanism C: one fact ("how does this package's CSS reach the page?") answered
 * differently by two packages a consumer uses together, with nothing reconciling them.
 * The fix is one rule, both packages checked against it.
 *
 * Two invariants:
 *   1. A published package that ships a stylesheet AND declares `sideEffects: ["**\/*.css"]`
 *      must import that stylesheet from its entry.
 *   2. If it does, it must also ship a CSS-free `node/` twin behind the `node` export
 *      condition — a bare `.css` side-effect import makes the bundle unloadable by a plain
 *      Node ESM loader (`ERR_UNKNOWN_FILE_EXTENSION`), the default state of an
 *      externalized dependency in every Vite SSR framework. Fixing the first invariant
 *      without the second just trades a styling bug for an SSR blocker.
 *   3. If the package ALSO ships modules that render inside the RSC server graph (JSX, no
 *      `'use client'`), it must offer a `react-server` condition resolving to the
 *      CSS-bearing build. Invariant 2 without this one trades the SSR blocker back for a
 *      styling bug: React Server Components resolve `react-server` then `node`, so without
 *      a `react-server` entry every `clientJs: 'none'` component renders from the CSS-free
 *      twin and its stylesheet is never collected. Measured on `apps/examples/react-next`:
 *      6 of the 11 hashed class names in the prerendered HTML had no rule anywhere in the
 *      emitted CSS — all six from server-rendered components. The workaround was to import
 *      the 328 KB aggregate `styles.css`, which is why an SSR page shipped ~384 KB of CSS
 *      to render one card. See docs/plans/ssr-css-and-client-js-plan.md.
 *
 * Needs a prior `pnpm build` — it reads `dist/`, i.e. what an adopter actually installs.
 * Skips cleanly when dist is absent so `pnpm ready`'s pre-build stages stay runnable.
 *
 * Run: `pnpm css-contract:check` (CI, after the build).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

interface PkgJson {
  name?: string
  private?: boolean
  sideEffects?: string[] | boolean
  exports?: Record<string, unknown>
}

/** Files under `dir`, recursively. */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

interface Candidate {
  name: string
  dir: string
  pkg: PkgJson
  stylesheets: string[]
  jsFiles: string[]
}

/** Published packages that declare CSS side effects and actually ship a stylesheet. */
function candidates(): Candidate[] {
  const out: Candidate[] = []
  for (const dirName of readdirSync(PACKAGES_DIR)) {
    const dir = join(PACKAGES_DIR, dirName)
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PkgJson
    } catch {
      continue
    }
    if (pkg.private === true) continue
    const declaresCssSideEffects =
      Array.isArray(pkg.sideEffects) && pkg.sideEffects.some((p) => p.includes('.css'))
    if (!declaresCssSideEffects) continue

    const dist = join(dir, 'dist')
    if (!existsSync(dist)) continue
    const files = walk(dist)
    const stylesheets = files.filter((f) => f.endsWith('.css'))
    if (stylesheets.length === 0) continue

    out.push({
      name: pkg.name ?? dirName,
      dir,
      pkg,
      stylesheets,
      jsFiles: files.filter((f) => f.endsWith('.js') && !f.includes(`${join('dist', 'node')}`)),
    })
  }
  return out
}

/**
 * Chunks that can render inside the RSC *server* graph: they emit JSX and carry no
 * `'use client'` directive, so an RSC bundler executes them on the server rather than
 * turning them into a client reference. These are the modules invariant 3 protects — a
 * `'use client'` chunk is re-resolved by the client bundler under browser conditions and
 * keeps its CSS either way.
 */
function serverRenderableChunks(c: Candidate): string[] {
  return c.jsFiles.filter((f) => {
    const code = readFileSync(f, 'utf8')
    if (!code.includes('react/jsx-runtime')) return false
    const firstLine = code.split('\n').find((l) => l.trim() !== '') ?? ''
    return !/^\s*(['"])use client\1;?\s*$/.test(firstLine)
  })
}

const built = existsSync(join(PACKAGES_DIR, 'charts/dist'))

describe('css-contract — a package that declares CSS side effects imports its own CSS', () => {
  it('every shipped stylesheet is reachable from the JS graph', { skip: !built }, () => {
    const offenders: string[] = []
    for (const c of candidates()) {
      // Any bare `.css` side-effect import anywhere in the shipped (non-node) JS counts:
      // @cascivo/react injects one per component, @cascivo/charts one in the entry.
      const importsCss = c.jsFiles.some((f) =>
        /import\s+['"][^'"]+\.css['"]/.test(readFileSync(f, 'utf8')),
      )
      if (!importsCss) {
        offenders.push(
          `${c.name}: ships ${c.stylesheets.length} stylesheet(s) and declares ` +
            `sideEffects CSS, but no dist JS imports a .css file`,
        )
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'These packages promise (via `sideEffects: ["**/*.css"]`) that their CSS rides along ' +
        'with the JS import, and it does not. Components render unstyled with no warning ' +
        'until the consumer finds the stylesheet subpath in the exports map — and a sibling ' +
        'package in the same family does auto-load, so there is no consistent rule to learn ' +
        `(2026-07-28 report C11).\n  ${offenders.join('\n  ')}`,
    )
  })

  it('a CSS-importing entry ships a CSS-free node twin', { skip: !built }, () => {
    const offenders: string[] = []
    for (const c of candidates()) {
      const entry = c.pkg.exports?.['.'] as Record<string, string> | string | undefined
      if (typeof entry !== 'object' || entry === null) continue
      const nodeTarget = entry['node']
      if (nodeTarget === undefined) {
        offenders.push(`${c.name}: no "node" export condition`)
        continue
      }
      const nodeEntry = join(c.dir, nodeTarget)
      if (!existsSync(nodeEntry)) {
        offenders.push(`${c.name}: "node" condition points at ${nodeTarget}, which is missing`)
        continue
      }
      if (/import\s+['"][^'"]+\.css['"]/.test(readFileSync(nodeEntry, 'utf8'))) {
        offenders.push(`${c.name}: ${nodeTarget} still imports CSS — it must be the CSS-free twin`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'A bare `.css` side-effect import makes a bundle unloadable by a plain Node ESM ' +
        'loader (ERR_UNKNOWN_FILE_EXTENSION) — the default state of an externalized ' +
        'dependency in every Vite SSR framework. Every package whose browser entry imports ' +
        'CSS must also ship a CSS-free twin behind the `node` export condition.\n  ' +
        offenders.join('\n  '),
    )
  })

  it(
    'a package with server-renderable modules offers a react-server condition',
    { skip: !built },
    () => {
      const offenders: string[] = []
      for (const c of candidates()) {
        const entry = c.pkg.exports?.['.'] as Record<string, string> | string | undefined
        if (typeof entry !== 'object' || entry === null) continue
        if (entry['node'] === undefined) continue
        const serverRenderable = serverRenderableChunks(c)
        if (serverRenderable.length === 0) continue

        const target = entry['react-server']
        if (target === undefined) {
          offenders.push(
            `${c.name}: ships ${serverRenderable.length} server-renderable module(s) but has ` +
              'no "react-server" export condition, so RSC falls through to "node" (CSS-free)',
          )
          continue
        }
        if (target === entry['node'] || target.includes('/node/')) {
          offenders.push(
            `${c.name}: "react-server" points at the CSS-free node twin (${target}) — it must ` +
              'resolve to the CSS-bearing build',
          )
          continue
        }
        if (!existsSync(join(c.dir, target))) {
          offenders.push(`${c.name}: "react-server" points at ${target}, which is missing`)
          continue
        }
        const order = Object.keys(entry)
        if (order.indexOf('react-server') > order.indexOf('node')) {
          offenders.push(
            `${c.name}: "react-server" is listed after "node" — export conditions match in ` +
              'declaration order, so "node" would win and the CSS-free twin would be used',
          )
        }
      }
      assert.deepEqual(
        offenders,
        [],
        'React Server Components resolve with the `react-server` condition and then `node`. A ' +
          'package that ships a CSS-free `node/` twin for bare-Node SSR must therefore point ' +
          '`react-server` at the CSS-BEARING build, or every component that renders on the ' +
          "server (exactly the `clientJs: 'none'` ones) loses its stylesheet silently — the " +
          'adopter is left importing the whole aggregate to get a styled page.\n  ' +
          offenders.join('\n  '),
      )
    },
  )

  it(
    'finds the packages it is meant to cover (guards against silent skips)',
    { skip: !built },
    () => {
      const names = candidates().map((c) => c.name)
      for (const expected of ['@cascivo/react', '@cascivo/charts']) {
        assert.ok(
          names.includes(expected),
          `expected ${expected} among CSS-shipping packages; found: ${names.join(', ') || '(none)'}`,
        )
      }
    },
  )
})
