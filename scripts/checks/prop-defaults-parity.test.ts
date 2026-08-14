/**
 * Prop-default parity guard (2026-07-25 plan, WS-7 / mechanism B).
 *
 * `props-parity` has always checked that manifest props match the TypeScript interface by
 * NAME and TYPE. It never checked defaults — and `PropMeta.default` was optional, so a
 * component could apply a default the manifest never mentioned. 33 props did.
 *
 * The generated props tables render a `Default` column, so those rows read `—`: an adopter
 * has no way to learn the value short of opening the shipped JS. That is exactly what
 * happened when `<Flex justify="between">` produced a centered vertical stack — `direction`
 * defaults to `'vertical'`, the opposite of CSS `flex-direction`, and the docs said nothing.
 * Three wrong layouts before the adopter read the bundle.
 *
 * The check is *derived*, not curated: the default is read from the component's parameter
 * destructuring, so the manifest is compared against what the code actually does.
 *
 * Run: `pnpm meta:check`.
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { comparableDefault, isLiteralDefault, signatureDefaults } from './lib/prop-defaults.ts'
import { resolveEntrySources } from './lib/registry-source.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface MetaProp {
  name: string
  default?: string
}
interface RegistryComponent {
  name: string
  files?: string[]
  meta?: { name: string; props?: MetaProp[] }
}

/**
 * Props whose signature default is deliberately not documented. Key: `<registry>.<prop>`.
 * Only for defaults that are meaningless to a reader (an internal sentinel), never for
 * "we didn't get to it" — the 33-prop sweep was completed, not deferred.
 */
const ALLOWLIST: Record<string, string> = {}

function loadRegistry(): RegistryComponent[] {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: RegistryComponent[]
    blocks?: RegistryComponent[]
  }
  return [...registry.components, ...(registry.blocks ?? [])]
}

interface Found {
  entry: string
  prop: string
  signature: string
  documented: string | undefined
}

function collect(): Found[] {
  const out: Found[] = []
  for (const component of loadRegistry()) {
    const meta = component.meta
    if (!meta) continue
    // Resolves BOTH copy-paste entries (via files[]) and npm-shipped ones (charts, flow,
    // editor) whose files[] is empty. This used to read `component.files ?? []` directly, so
    // the loop body was dead for all 37 npm-shipped entries — including the test below named
    // "no documented default contradicts the signature", which sat green while
    // `chart/sparkline` documented `width: 80` and applied 120. That mismatch was found on
    // 2026-08-06, written into the ledger as closed, and re-reported on 2026-08-14.
    //
    // props-parity and typedefs-parity were migrated to resolveEntrySources() for exactly
    // this reason on 2026-08-08; this third consumer of the same dead branch was missed.
    for (const url of resolveEntrySources(REPO_ROOT, component)) {
      const file = join(REPO_ROOT, url)
      if (!existsSync(file)) continue
      for (const [prop, signature] of signatureDefaults(file, meta.name)) {
        const documented = (meta.props ?? []).find((p) => p.name === prop)
        if (!documented) continue // not a documented prop at all — props-parity's job
        out.push({ entry: component.name, prop, signature, documented: documented.default })
      }
    }
  }
  return out
}

describe('prop-defaults-parity — every applied default is documented', () => {
  const found = collect()

  it('resolves a plausible number of defaults', () => {
    assert.ok(
      found.length > 150,
      `only ${found.length} signature defaults resolved — is the extractor broken?`,
    )
  })

  it('covers the npm-shipped packages, not just the copy-paste ones', () => {
    // Ported verbatim from props-parity. Without a floor, this guard can silently regress to
    // zero coverage for charts/flow/editor — which is exactly what it did for the whole life
    // of the guard, while carrying a test named "no documented default contradicts the
    // signature" and an empty allowlist. `chart/sparkline` documented 80 and applied 120 that
    // entire time (2026-08-06 found it, 2026-08-14 re-reported it).
    // The floor is on entries whose SOURCE RESOLVED, not on entries that happen to apply a
    // default — plenty of charts legitimately have none, so counting defaults would make the
    // floor track authoring choices instead of resolver health.
    for (const [prefix, floor] of [
      ['chart/', 22],
      ['flow/', 8],
      ['editor/', 2],
    ] as const) {
      const covered = loadRegistry()
        .filter((c) => c.name.startsWith(prefix) && c.meta)
        .filter((c) => resolveEntrySources(REPO_ROOT, c).length > 0).length
      assert.ok(
        covered >= floor,
        `only ${covered} '${prefix}' entries resolved their source (expected >= ${floor}). ` +
          'These are npm-shipped, so their source comes from resolveEntrySources(), not files[].',
      )
    }
  })

  it('no component applies a default its manifest does not document', () => {
    const errors = found
      .filter((f) => f.documented === undefined)
      .filter((f) => ALLOWLIST[`${f.entry}.${f.prop}`] === undefined)
      .map(
        (f) =>
          `  ${f.entry}: '${f.prop}' defaults to ${f.signature} in the signature, ` +
          `but the manifest documents no default (the generated props table will show "—")`,
      )
    assert.deepEqual(
      errors,
      [],
      `Undocumented prop defaults — add \`default\` to the .meta.ts prop entry, then ` +
        `\`pnpm regen\`:\n${errors.join('\n')}`,
    )
  })

  it('no documented default contradicts the signature', () => {
    const errors = found
      .filter((f) => f.documented !== undefined && isLiteralDefault(f.signature))
      .filter((f) => comparableDefault(f.documented!) !== comparableDefault(f.signature))
      .map(
        (f) =>
          `  ${f.entry}: '${f.prop}' — manifest says ${f.documented}, signature says ${f.signature}`,
      )
    assert.deepEqual(
      errors,
      [],
      `Manifest defaults disagree with the code (a wrong default is worse than none):\n${errors.join('\n')}`,
    )
  })

  it('the allowlist has no stale entries', () => {
    const live = new Set(found.map((f) => `${f.entry}.${f.prop}`))
    const stale = Object.keys(ALLOWLIST).filter((k) => !live.has(k))
    assert.deepEqual(stale, [], `Stale prop-defaults allowlist entries — remove them: ${stale}`)
  })
})
