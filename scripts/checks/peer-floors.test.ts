/**
 * Peer-floor check — two invariants about what a published package promises its
 * consumer's dependency graph will contain.
 *
 * 1. Every published (`private !== true`) package that peer-depends on
 *    `@preact/signals-react` must floor it at `>=3.0.0`.
 *
 *    React 19 removed the internal that signals-react 2.x imports, so a 2.x runtime
 *    fails to load under React 19 (`SyntaxError: … '__SECRET_INTERNALS…'`). A floor of
 *    `>=2.0.0` admitted that broken install; a TanStack Start adopter hit it (2026-07-20).
 *
 * 2. Every published package whose **types** import from `react` must declare an
 *    optional `@types/react` peer.
 *
 *    This is the 2026-07-28 incident-console blocker (C1). `@types/react` was in
 *    `devDependencies` only, so under pnpm's isolated layout nothing put it on
 *    `@cascivo/react`'s resolution path. `import { HTMLAttributes } from 'react'` in the
 *    emitted `.d.ts` failed to resolve, every `extends HTMLAttributes<…>` collapsed to an
 *    error type, and `skipLibCheck: true` hid the cause — so `children`, `className`,
 *    `style`, `onClick` and every `aria-*` prop silently vanished from every component.
 *    18 errors from a 90-line file; strict TS + pnpm could not type-check at all.
 *
 *    The monorepo could not see it: `@types/react` is hoisted to the repo root here, so
 *    each package's own `tsc --noEmit` passes. That is Mechanism E — see
 *    `docs/internal/feedback/README.md`.
 *
 *    ⚠ **The exact C1 mechanism is not reproduced.** `pnpm isolated:check` type-checks the
 *    packed tarballs in a strict, non-hoisted pnpm workspace on the reporter's own
 *    TypeScript version, and cascivo's types resolve there even *without* this peer — see
 *    that file's header for the full negative result. The peer is still correct: it is the
 *    convention for typed React libraries and makes resolution deliberate rather than
 *    dependent on a layout accident. This guard keeps it from regressing.
 *
 *    Optional, not required: a JS-only consumer must not get an install warning for types
 *    they will never read. And a peer rather than a `dependency`, because a bundled copy
 *    of `@types/react` conflicts with the app's own React types (duplicate-`JSX` errors).
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const SIGNALS = '@preact/signals-react'
const REQUIRED_FLOOR = '>=3.0.0'
const TYPES_REACT = '@types/react'
const TYPES_REACT_FLOOR = '>=18.0.0'

interface PkgJson {
  name?: string
  private?: boolean
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function packagesWithSignalsPeer(): { name: string; floor: string }[] {
  const out: { name: string; floor: string }[] = []
  for (const dir of readdirSync(PACKAGES_DIR)) {
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8')) as PkgJson
    } catch {
      continue
    }
    if (pkg.private === true) continue
    const floor = pkg.peerDependencies?.[SIGNALS]
    if (typeof floor === 'string') out.push({ name: pkg.name ?? dir, floor })
  }
  return out
}

describe('peer-floors — signals-react floored at 3.x', () => {
  it(`every published package flooring ${SIGNALS} requires ${REQUIRED_FLOOR}`, () => {
    const offenders = packagesWithSignalsPeer().filter((p) => p.floor !== REQUIRED_FLOOR)
    assert.deepEqual(
      offenders.map((o) => `${o.name} (${o.floor})`),
      [],
      `These packages declare a ${SIGNALS} peer floor other than ${REQUIRED_FLOOR}; React 19 ` +
        `needs signals-react 3.x. Offenders: ${offenders.map((o) => o.name).join(', ')}`,
    )
  })

  it('finds the expected set of signals-peered packages (guards against silent skips)', () => {
    // Published only — `@cascivo/render` also peers signals but is private.
    const count = packagesWithSignalsPeer().length
    assert.ok(
      count >= 8,
      `expected at least 8 published packages peer-depending on ${SIGNALS}, found ${count}`,
    )
  })
})

/** Every `.ts`/`.tsx` under `dir`, skipping tests, fixtures and build output. */
function sourceFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '__fixtures__') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/**
 * Does this file contain a real module-level `… from 'react'` import?
 *
 * Template literals are stripped first, because `cascivo`'s scaffolder emits
 * ``return `import React from 'react'…` `` — generated *output*, not the CLI's own type
 * surface. Without the strip this guard demands an `@types/react` peer on a package that
 * ships no React types at all, and a guard that asks for the wrong thing gets allowlisted
 * into uselessness. The remaining regex is line-anchored so only a statement in import
 * position counts.
 */
function importsReactTypes(source: string): boolean {
  const withoutTemplates = source.replace(/`(?:[^`\\]|\\[\s\S])*`/g, '``')
  return /^\s*import\s[^`;]*?\bfrom\s+['"]react['"]/m.test(withoutTemplates)
}

/**
 * True when a file re-exports source from OUTSIDE its own package that imports React types.
 *
 * `@cascivo/react` is the case that needs this: it is a barrel whose `index.ts` re-exports
 * `../../components/src/**` and `../../layouts/src/**`, so its emitted `.d.ts` is full of
 * React types while its own `src/` may contain not one `from 'react'`. That became true the
 * moment `theme.tsx` moved to `@cascivo/core`, and the guard's vacuity check caught the
 * package silently dropping off the list — which is the whole reason that check exists.
 *
 * One hop is enough: the barrel re-exports component source directly.
 */
function reExportsReactTypedSource(file: string): boolean {
  const source = readFileSync(file, 'utf8')
  for (const m of source.matchAll(/from\s+['"](\.\.\/\.\.\/[^'"]+)['"]/g)) {
    const target = resolve(dirname(file), m[1]!)
    for (const candidate of [`${target}.ts`, `${target}.tsx`, join(target, 'index.ts')]) {
      if (!existsSync(candidate)) continue
      if (importsReactTypes(readFileSync(candidate, 'utf8'))) return true
    }
  }
  return false
}

/**
 * Published packages whose emitted types will reference React's own types.
 *
 * Derived from the source rather than from a hand-kept list — the Mechanism-B lesson:
 * a package that gains a React type import gets flagged here without anyone remembering
 * to update this file. A *type-only* import is enough (and is the common case): it is
 * `import type { HTMLAttributes } from 'react'` that lands in the `.d.ts`.
 */
function publishedPackagesUsingReactTypes(): string[] {
  const out: string[] = []
  for (const dir of readdirSync(PACKAGES_DIR)) {
    let pkg: PkgJson
    try {
      pkg = JSON.parse(readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8')) as PkgJson
    } catch {
      continue
    }
    if (pkg.private === true) continue
    const own = sourceFiles(join(PACKAGES_DIR, dir, 'src'))
    const usesReact =
      own.some((file) => importsReactTypes(readFileSync(file, 'utf8'))) ||
      own.some((file) => reExportsReactTypedSource(file))
    if (usesReact) out.push(dir)
  }
  return out
}

describe('peer-floors — @types/react is reachable from a consumer install', () => {
  it('every published package whose types import from `react` peers @types/react optionally', () => {
    const offenders: string[] = []
    for (const dir of publishedPackagesUsingReactTypes()) {
      const pkg = JSON.parse(
        readFileSync(join(PACKAGES_DIR, dir, 'package.json'), 'utf8'),
      ) as PkgJson
      const name = pkg.name ?? dir
      const floor = pkg.peerDependencies?.[TYPES_REACT]
      if (floor === undefined) {
        offenders.push(`${name}: no "${TYPES_REACT}" in peerDependencies`)
        continue
      }
      if (floor !== TYPES_REACT_FLOOR) {
        offenders.push(
          `${name}: "${TYPES_REACT}" floored at ${floor}, expected ${TYPES_REACT_FLOOR}`,
        )
      }
      if (pkg.peerDependenciesMeta?.[TYPES_REACT]?.optional !== true) {
        offenders.push(`${name}: "${TYPES_REACT}" must be peerDependenciesMeta.optional = true`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      "Published packages import React types but do not put @types/react on a consumer's " +
        'resolution path. Under pnpm this silently strips children/className/onClick/aria-* ' +
        'from every component (2026-07-28 report C1). Add to each package.json:\n' +
        `  "peerDependencies":     { "${TYPES_REACT}": "${TYPES_REACT_FLOOR}", … }\n` +
        `  "peerDependenciesMeta": { "${TYPES_REACT}": { "optional": true } }\n` +
        `Offenders:\n  ${offenders.join('\n  ')}`,
    )
  })

  it('finds the expected set of React-typed packages (guards against silent skips)', () => {
    const found = publishedPackagesUsingReactTypes()
    for (const expected of ['react', 'core', 'charts', 'icons']) {
      assert.ok(
        found.includes(expected),
        `expected @cascivo/${expected} to be detected as importing React types, but the ` +
          `detector found only: ${found.join(', ')}. If the detector broke, this guard is ` +
          `passing vacuously.`,
      )
    }
  })
})
