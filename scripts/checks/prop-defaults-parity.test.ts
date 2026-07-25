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

/** `…/main/packages/x` → `packages/x`. */
function repoRelative(url: string): string {
  const i = url.indexOf('/packages/')
  return i === -1 ? url : url.slice(i + 1)
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
    for (const url of (component.files ?? []).filter((f) => f.endsWith('.tsx'))) {
      const file = join(REPO_ROOT, repoRelative(url))
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
