/**
 * Path B reachability guard (2026-07-25 plan, WS-14 / mechanism A).
 *
 * The contradiction this closes: `docs/AI-RULES.md` — the file meant to be pasted verbatim
 * into an agent's system prompt — says "never `useState`, use `useSignal`", while
 * `docs/USING-WITH-VITE-SSR.md` says a prebuilt-path (Path B) app must never depend on
 * `@cascivo/core`, which was the only place `useSignal` lived. Under pnpm's strict layout
 * `import … from '@cascivo/core'` is a phantom-dependency error, so an adopter following
 * both documented rules had no legal move. The one who reported it added `@cascivo/core` as
 * a direct dependency — the thing the SSR guide calls a mistake — and pinned two packages in
 * lockstep.
 *
 * So: every primitive the reactivity docs name must be importable from `@cascivo/react`.
 * This guard reads the names out of the docs and asserts each is a named export of
 * `packages/react/src/index.ts`, so the docs cannot again name something Path B can't reach.
 *
 * Run: `pnpm meta:check`.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { reactExportedNames } from '../registry/react-exports.ts'
import { SELF_SUBSCRIBING_HOOKS } from './self-subscribe-contract.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const REACT_INDEX = join(REPO_ROOT, 'packages/react/src/index.ts')

/**
 * Primitives that live in another package and are correctly imported from there, so they
 * are not expected in `@cascivo/react`'s own export list.
 */
const NOT_FROM_REACT = new Set([
  'currentLocale', // @cascivo/i18n — and documented as the one non-hook exception
])

/**
 * Names the reactivity contract tells an app to use. Sourced from the hooks contract plus
 * the primitives `docs/AI-RULES.md` names in its pasteable block.
 */
const REQUIRED_PRIMITIVES = [
  ...SELF_SUBSCRIBING_HOOKS.map((h) => h.name),
  'useSignals',
  'useSignalEffect',
  'useEffectPropSignal',
  'signal',
  'computed',
  'effect',
  'batch',
  'createScope',
  'createMachine',
  'useId',
  'setLinkComponent',
  'getLinkComponent',
].filter((n) => !NOT_FROM_REACT.has(n))

describe('Path B parity — the reactivity contract is reachable from @cascivo/react', () => {
  // Shared with scripts/llms/generate.ts, which uses the same resolved export list to decide
  // each registry entry's distribution channel — so "is it importable" has ONE answer.
  const exported = reactExportedNames(REPO_ROOT)

  for (const name of REQUIRED_PRIMITIVES) {
    it(`@cascivo/react exports ${name}`, () => {
      assert.ok(
        exported.has(name),
        `The reactivity docs tell an app to use \`${name}\`, but @cascivo/react does not ` +
          `export it — so a Path B adopter can only get it by adding @cascivo/core as a ` +
          `direct dependency, which USING-WITH-VITE-SSR.md tells them not to do. ` +
          `Re-export it (named, never \`export *\`) from packages/react/src/index.ts.`,
      )
    })
  }

  it('re-exports stay named, so the flat index.d.ts does not absorb all of @cascivo/core', () => {
    // Comments stripped: index.ts documents this very rule in prose, and matching the
    // warning text instead of the code is how a guard passes while the thing it guards
    // is broken — the failure mode this whole plan is about.
    const src = readFileSync(REACT_INDEX, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
    assert.doesNotMatch(
      src,
      /export\s+\*\s+from\s+'@cascivo\/core'/,
      'A star re-export of @cascivo/core drags its whole surface into the published flat ' +
        'index.d.ts and breaks check-types-flat/check-styles-complete. Re-export by name.',
    )
  })
})

describe('Path B parity — the SSR guide no longer forbids what the contract requires', () => {
  it('USING-WITH-VITE-SSR.md points Path B at @cascivo/react for primitives', () => {
    const guide = readFileSync(join(REPO_ROOT, 'docs/USING-WITH-VITE-SSR.md'), 'utf8')
    assert.ok(
      guide.includes('@cascivo/react'),
      'The SSR guide must tell Path B adopters where primitives DO come from, not only ' +
        'which package to avoid. A prohibition with no alternative is what produced the ' +
        'contradiction this guard exists for.',
    )
  })
})
