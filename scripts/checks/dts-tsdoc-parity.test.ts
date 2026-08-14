/**
 * The published `.d.ts` must keep the TSDoc its source wrote.
 *
 * ## Why
 *
 * Adopter reports keep naming the shipped `.d.ts` as cascivo's best documentation surface —
 * the 2026-08-14 reporter listed it third among what went well: *"Every prop I was unsure
 * about had the answer plus the rationale plus, often, the dated adopter report that caused
 * the note. I never had to guess and then compile to find out."* The whole prop-documentation
 * strategy leans on that: `tsdoc:generate` derives `@defaultValue` blocks from manifests into
 * source TSDoc, and the value only reaches an adopter if the build carries them through.
 *
 * Nothing asserted it. `@cascivo/react` builds via `vp build && flatten-types.mjs`, and a
 * `removeComments`-style regression in either — or a dts-bundler swap — would silently strip
 * every prop comment from `dist/index.d.ts`. The package would still typecheck, every guard
 * would stay green, and the loss would surface only as a future adopter saying "the `.d.ts`
 * entry is bare".
 *
 * That is the exact shape of Mechanism A: a load-bearing claim that exists only as prose.
 *
 * ## What this checks, and what it deliberately does not
 *
 * **Checks:** a prop whose SOURCE interface carries a doc comment must carry one in the
 * published `dist/index.d.ts`. That is a build-integrity invariant — it fails when the
 * pipeline drops comments, which is the risk worth holding.
 *
 * **Does not check:** that every documented prop has source TSDoc in the first place. 235 of
 * 445 props with a substantial manifest description carry no source doc comment (measured
 * 2026-08-14). That is a real authoring gap, but it is a catalog-wide writing task, not a
 * build invariant, and conflating the two would make this guard un-turn-on-able. It is
 * tracked separately rather than smuggled in here.
 *
 * Needs a prior `pnpm build` — it reads `dist/`, i.e. what an adopter installs. Skips cleanly
 * when dist is absent so the pre-build stages of `pnpm ready` stay runnable.
 *
 * Run: `pnpm dts-tsdoc:check` (CI, after the build).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { resolveEntrySources } from './lib/registry-source.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DTS = join(REPO_ROOT, 'packages/react/dist/index.d.ts')

interface RegistryComponent {
  name: string
  files?: string[]
  meta?: { name: string; props?: { name: string }[] }
}

/** `interface XProps { … }` bodies, keyed by interface name. */
function interfaceBodies(source: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of source.matchAll(/interface (\w+Props)[^{]*\{([\s\S]*?)\n\}/g)) {
    out.set(m[1]!, m[2]!)
  }
  return out
}

/**
 * Whether `prop` in `body` is preceded by a doc comment. `null` when the prop is not declared
 * in this body at all (inherited, renamed, or spread from a base type) — not comparable.
 */
function hasDocComment(body: string, prop: string): boolean | null {
  const candidates = [body.indexOf(`\n  ${prop}?:`), body.indexOf(`\n  ${prop}:`)].filter(
    (i) => i >= 0,
  )
  if (candidates.length === 0) return null
  return /\*\/\s*$/.test(body.slice(0, Math.min(...candidates)))
}

describe('dts-tsdoc-parity — the build does not strip prop documentation', () => {
  if (!existsSync(DTS)) {
    it('skipped — packages/react/dist/index.d.ts absent (run `pnpm build`)', () => {})
    return
  }

  const dtsBodies = interfaceBodies(readFileSync(DTS, 'utf8'))
  const registry = (
    JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
      components: RegistryComponent[]
    }
  ).components

  const stripped: string[] = []
  let comparable = 0

  for (const component of registry) {
    const name = component.meta?.name
    if (!name) continue
    const dtsBody = dtsBodies.get(`${name}Props`)
    if (!dtsBody) continue

    for (const file of resolveEntrySources(REPO_ROOT, component)) {
      const path = join(REPO_ROOT, file)
      if (!existsSync(path)) continue
      const declaration = new RegExp(
        `export interface ${name}Props[^{]*\\{([\\s\\S]*?)\\n\\}`,
      ).exec(readFileSync(path, 'utf8'))
      if (!declaration) continue

      for (const prop of component.meta?.props ?? []) {
        const inSource = hasDocComment(declaration[1]!, prop.name)
        const inDist = hasDocComment(dtsBody, prop.name)
        if (inSource === null || inDist === null) continue
        comparable++
        if (inSource && !inDist) stripped.push(`${name}.${prop.name}`)
      }
    }
  }

  it('compares a plausible number of props (guards against passing vacuously)', () => {
    // A regex that stops matching — an interface-declaration style change, a dts-bundler that
    // emits `type X = {…}` instead of `interface X {…}` — would make this guard pass by
    // comparing nothing at all, which is the failure mode `props-parity` learned the hard way.
    assert.ok(
      comparable > 500,
      `only ${comparable} source↔dist prop pairs were comparable (expected > 500). ` +
        'The extractor is probably broken — otherwise every prop passes by never being checked.',
    )
  })

  it('every prop documented in source is still documented in the published .d.ts', () => {
    assert.deepEqual(
      stripped,
      [],
      'These props carry a doc comment in their source interface but NOT in the published ' +
        '`packages/react/dist/index.d.ts`, so the build is dropping documentation on the way ' +
        'out. Adopters read the shipped `.d.ts` as the primary prop reference — losing the ' +
        'comments there is invisible to every other guard, because the types still compile.\n' +
        'Check `vp build`s dts step and `packages/react/scripts/flatten-types.mjs`.\n  ' +
        stripped.join('\n  '),
    )
  })
})
