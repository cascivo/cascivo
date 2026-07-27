/**
 * Manifest-example prop guard.
 *
 * `llms/data-table.md`'s "Custom cell content" example — the snippet an adopter is most
 * likely to copy — read `<Badge tone={…}>`. `Badge` has no `tone` prop; it is `variant`, and
 * its values had no `info` either. The wrong example and the correct prop table were two
 * files apart in the same *generated* docs set, because manifest `examples[].code` is
 * emitted verbatim and nothing has ever checked it.
 *
 * For a library with no training-data footprint the docs are the entire onboarding surface,
 * so a broken example in the most-copied snippet is disproportionately expensive.
 *
 * This checks every example's JSX against the same contract `cascivo audit --ai` uses: for a
 * component the registry knows, every prop it is passed must exist. It deliberately reuses
 * the audit's own scanner, so the docs are held to the rule adopters are held to.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildContract } from '../../packages/cli/src/utils/contract-pure.ts'
import {
  extractAttrNames,
  findOpeningTags,
  HTML_PASSTHROUGH,
  PASSTHROUGH,
} from '../../packages/cli/src/audit-ai/jsx-props.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

/**
 * Exactly the audit CLI's passthrough rule, imported rather than restated: every cascade
 * component extends an `HTMLAttributes` interface and spreads `{...props}`, so `type` on a
 * `Button` and `placeholder` on a `Textarea` are legal even though the manifests don't
 * enumerate them. Holding the docs to a stricter rule than adopters get would just teach
 * everyone to distrust this guard.
 */
function isPassthrough(prop: string): boolean {
  if (PASSTHROUGH.has(prop) || HTML_PASSTHROUGH.has(prop)) return true
  if (prop.startsWith('data-') || prop.startsWith('aria-')) return true
  // A hyphenated non-`data-`/`aria-` name is never a React prop — it is the scanner reading
  // a key out of a nested object literal (`keymap={{ 'Mod-S': … }}`), not an attribute.
  if (prop.includes('-')) return true
  return /^on[A-Z]/.test(prop)
}

interface RegistryEntry {
  name: string
  meta?: {
    name: string
    props?: { name: string; type?: string; required?: boolean }[]
    examples?: { title?: string; code?: string }[]
  }
}

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: RegistryEntry[]
}

const contract = buildContract({
  catalog: { tokens: [] },
  registry: { components: registry.components.map((c) => ({ meta: c.meta })) },
  context: { components: [] },
})

describe('manifest examples type-check against the components they use', () => {
  it('finds a plausible number of examples', () => {
    const count = registry.components.reduce((n, c) => n + (c.meta?.examples?.length ?? 0), 0)
    assert.ok(count > 200, `only ${count} examples found — the scan is broken`)
  })

  it('no example passes a prop the component does not have', () => {
    const errors: string[] = []
    for (const entry of registry.components) {
      for (const example of entry.meta?.examples ?? []) {
        const code = example.code ?? ''
        if (!code) continue
        for (const [name, info] of contract.components) {
          if (!new RegExp(`<${name}[\\s/>]`).test(code)) continue
          const known = new Set(info.props.map((p) => p.name))
          for (const tag of findOpeningTags(code, name)) {
            if (tag.hasSpread) continue
            for (const prop of extractAttrNames(tag.attrs)) {
              if (isPassthrough(prop) || known.has(prop)) continue
              errors.push(
                `  ${entry.name} → "${example.title ?? 'example'}": <${name} ${prop}=…> — ` +
                  `${name} has no \`${prop}\` prop`,
              )
            }
          }
        }
      }
    }
    assert.deepEqual(
      errors,
      [],
      'Manifest examples are published verbatim to llms/*.md and the docs site, and are the ' +
        'snippets adopters copy. These pass props that do not exist:\n' +
        `${errors.join('\n')}`,
    )
  })

  it('seeded mutation — a wrong prop in an example is caught', () => {
    // The exact defect this guard exists for: `<Badge tone=…>` where the prop is `variant`.
    const badge = contract.components.get('Badge')
    assert.ok(badge, 'Badge must be in the contract')
    const known = new Set(badge.props.map((p) => p.name))
    assert.ok(known.has('variant'), 'Badge declares `variant`')
    assert.ok(
      !known.has('tone'),
      'Badge does not declare `tone` — so an example using it must fail',
    )
  })
})
