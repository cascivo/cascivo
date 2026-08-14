/**
 * Type-level Path B parity — every type naming a published prop must be importable.
 *
 * ## Why (Mechanism D)
 *
 * `path-a-parity` and `path-b-parity` both exist and both check *values*: is this hook, this
 * component, this function reachable on each consumption path. Nothing checked **types**.
 *
 * So `ToneInput` — the declared type of `Status.status` and `Badge.variant` — was reachable on
 * neither path an adopter is told to use. It lives in `@cascivo/core`, which on the prebuilt
 * path is a transitive dependency that `docs/GETTING-STARTED.md` explicitly says not to
 * install. The 2026-08-14 adopter went to write the first thing every dashboard writes, a
 * `Record<DeployState, Tone>`, found no supported import, and fell back to
 * `type Tone = NonNullable<StatusProps['status']>`. That compiles, but as they put it: "a
 * workaround, not an API", and most people will inline a string union and lose the type link.
 *
 * A value export is obvious when it is missing — the import fails at runtime. A type export is
 * invisible: everything still compiles, the adopter just cannot *name* the type, so the gap
 * only surfaces as a report.
 *
 * ## The invariant
 *
 * Every name the published `dist/index.d.ts` imports from `@cascivo/core` — i.e. every
 * core-owned name the public surface actually references — must be exported from either
 * `@cascivo/react` (the main entry) or `@cascivo/react/types` (the vocabulary subpath).
 *
 * This is derived from the built artifact rather than from a curated list, so a new component
 * whose prop is typed with some other core type fails here on the build that introduces it.
 * It found `NavigationMenu.orientation` (`RovingOrientation`) on its first run — a second
 * instance the report never mentioned.
 *
 * Needs a prior `pnpm build`. Skips cleanly when dist is absent.
 *
 * Run: `pnpm type-exports:check` (CI, after the build).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(REPO_ROOT, 'packages/react/dist')
const INDEX_DTS = join(DIST, 'index.d.ts')
const TYPES_DTS = join(DIST, 'types.d.ts')

/**
 * Core-owned names that deliberately do NOT ship from `@cascivo/react`, with the reason.
 * An entry here is a decision, not a backlog item.
 */
const ALLOWLIST: Record<string, string> = {
  Signal:
    '`@preact/signals-react` is a PEER dependency of @cascivo/react, so a Path B consumer ' +
    'already lists it and `import type { Signal } from "@preact/signals-react"` is a legal, ' +
    'non-phantom import. Re-exporting it here would also make the dts bundler emit `Signal$1` ' +
    'throughout the flat index.d.ts (WS-F, check-styles-complete).',
}

describe('type-exports-parity — every core type naming a published prop is importable', () => {
  if (!existsSync(INDEX_DTS)) {
    it('skipped — packages/react/dist absent (run `pnpm build`)', () => {})
    return
  }

  const indexDts = readFileSync(INDEX_DTS, 'utf8')

  const coreImport = /import \{([^}]*)\} from ["']@cascivo\/core["']/.exec(indexDts)
  const referenced = coreImport
    ? coreImport[1]!.split(',').map((s) =>
        s
          .trim()
          .split(/\s+as\s+/)[0]!
          .trim(),
      )
    : []

  /** Names the main entry re-exports (its final flat `export { … }` statement). */
  const mainExports = new Set<string>()
  const exportBlocks = [...indexDts.matchAll(/^export \{([\s\S]*?)\};/gm)]
  const last = exportBlocks.at(-1)
  if (last) {
    for (const name of last[1]!.split(',')) {
      mainExports.add(name.trim().replace(/^type\s+/, ''))
    }
  }

  /** Names the `./types` subpath exports. */
  const subpathExports = new Set<string>()
  if (existsSync(TYPES_DTS)) {
    const block = /export type \{([\s\S]*?)\} from/.exec(readFileSync(TYPES_DTS, 'utf8'))
    if (block) {
      for (const name of block[1]!.split(',')) {
        const clean = name
          .trim()
          .replace(/^\/\/.*$/gm, '')
          .trim()
        if (clean && !clean.startsWith('//')) subpathExports.add(clean)
      }
    }
  }

  it('parses the built surface (guards against passing vacuously)', () => {
    assert.ok(
      referenced.length > 40,
      `only ${referenced.length} names parsed out of the @cascivo/core import in index.d.ts — ` +
        'the dts shape changed and every name would otherwise pass by never being checked.',
    )
    assert.ok(
      mainExports.size > 300,
      `only ${mainExports.size} names parsed out of the main export statement — parser broken?`,
    )
  })

  it('no core type naming a published prop is unreachable on the prebuilt path', () => {
    const unreachable = referenced
      .filter((name) => !mainExports.has(name))
      .filter((name) => !subpathExports.has(name))
      .filter((name) => ALLOWLIST[name] === undefined)
    assert.deepEqual(
      unreachable,
      [],
      'These @cascivo/core names are referenced by the published `@cascivo/react` surface but ' +
        'are exported from neither `@cascivo/react` nor `@cascivo/react/types`. A prebuilt ' +
        'adopter cannot name them: @cascivo/core is a transitive dep they are told not to ' +
        'install, so there is no supported import and the only fallback is ' +
        "`NonNullable<XProps['prop']>`.\n" +
        'Add them to `packages/react/src/types.ts` AND to the `TYPES_DTS` literal in ' +
        '`packages/react/scripts/flatten-types.mjs`, or allowlist with a reason here.\n  ' +
        unreachable.join('\n  '),
    )
  })

  it('the allowlist has no stale entries', () => {
    const stale = Object.keys(ALLOWLIST).filter((name) => !referenced.includes(name))
    assert.deepEqual(stale, [], `Stale type-exports allowlist entries — remove them: ${stale}`)
  })
})
