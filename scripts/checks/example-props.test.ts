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
import { readFileSync, readdirSync, statSync } from 'node:fs'
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

  it('every chart example passes the required keys of its datum type', () => {
    // The sibling of the prop check, one level down. `example-props` validates props ON the
    // component; nothing looked INSIDE `data={[{…}]}`, so PieChart's "Basic pie chart"
    // example — the first one an adopter copies — omitted the `id` that `PieChartDatum`
    // requires, while a later example on the same page included it. Only the .d.ts said so
    // (2026-08-14 report §13).
    const metaFiles = (dir: string): string[] => {
      const out: string[] = []
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) out.push(...metaFiles(full))
        else if (entry.endsWith('.meta.ts')) out.push(full)
      }
      return out
    }
    const CHARTS = join(ROOT, 'packages/charts/src')
    const errors: string[] = []
    for (const metaPath of metaFiles(CHARTS)) {
      const source = readFileSync(metaPath, 'utf8')
      const tsx = metaPath.replace('.meta.ts', '.tsx')
      let required: string[] = []
      try {
        const declaration = /export interface (\w*Datum)\b[^{]*\{([\s\S]*?)\n\}/.exec(
          readFileSync(tsx, 'utf8'),
        )
        // `name:` without `?` — an optional key is not required.
        if (declaration)
          required = [...declaration[2]!.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]!)
      } catch {
        continue
      }
      if (required.length === 0) continue
      for (const example of source.matchAll(/data=\{\[\s*\{([^}]*)\}/g)) {
        const keys = [...example[1]!.matchAll(/(\w+)\s*:/g)].map((m) => m[1]!)
        const missing = required.filter((key) => !keys.includes(key))
        if (missing.length > 0) {
          errors.push(
            `  ${metaPath.split('/').pop()}: data item {${keys.join(', ')}} is missing ` +
              `required ${missing.map((k) => `\`${k}\``).join(', ')}`,
          )
        }
      }
    }
    assert.deepEqual(
      errors,
      [],
      'These manifest examples build a chart datum without every required key, so the ' +
        'snippet an adopter copies does not typecheck:\n' +
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
