#!/usr/bin/env node
/**
 * Generate `audit-contract.json` — the slice of the cascivo contract that `cascivo audit --ai`
 * needs, small enough to ship inside the CLI.
 *
 * Why: the audit engine works, and an adopter confirmed it reports genuinely useful findings
 * (an untranslated button string, props it couldn't verify through a spread). It was simply
 * unreachable — `loadContract` walked up ten directories looking for `apps/site/public/`, a
 * path that exists only in this monorepo, so in any real project it died with
 * "Contract unavailable: token catalog not found" before analysing a single file. The
 * documented override-escalation ladder in AI-RULES.md was built on a command nobody outside
 * this repo could run.
 *
 * Shipping the three source artifacts wholesale would add ~2.3 MB to the CLI
 * (`tokens.catalog.json` 68 KB + `context.json` 1.1 MB + `registry.json` 1.1 MB). The audit
 * reads only three things from them (see `packages/cli/src/utils/contract-pure.ts`):
 *   - token name → resolved default value, for the value→token map
 *   - per-component prop name/type/required, for prop verification
 *   - which components declare user-facing chrome text (`intent.content`)
 * That slice is ~55 KB raw / ~10 KB gzipped.
 *
 * Written to both `packages/cli/src/generated/` (bundled into the published CLI) and
 * `apps/site/public/` (served for the network fallback + cache).
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolvePropSets } from '../checks/lib/component-props.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')

interface TokenEntry {
  name: string
  resolvedDefault: string | null
}
interface PropEntry {
  name: string
  type?: string
  required?: boolean
}
interface ComponentEntry {
  meta?: { name: string; props?: PropEntry[] }
  files?: string[]
}
interface ContextEntry {
  name: string
  intent?: { content?: { contentPrimitive?: boolean } }
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(REPO_ROOT, rel), 'utf8')) as T
}

const catalog = readJson<{ tokens: TokenEntry[] }>('apps/site/public/tokens.catalog.json')
const registry = readJson<{ version: string; components: ComponentEntry[] }>('registry.json')
const context = readJson<{ components: ContextEntry[] }>('apps/site/public/context.json')

/**
 * Attribute names cascivo components inherit from a React DOM base, resolved from the types
 * rather than hand-listed.
 *
 * `HTML_PASSTHROUGH` in the audit was 48 names typed out by hand, so any valid attribute
 * outside it was a hard `unknown-prop` **error** on correct, type-checked code. `<Form
 * noValidate>` was reported that way, and since the audit is pitched as a CI gate the
 * adopter deleted a legitimate prop to get it green. A hand list can never be complete; the
 * type checker already knows the answer.
 *
 * Computed as (resolved properties − own declared properties) per component, unioned. The
 * union keeps the shipped contract small — per-component sets would repeat ~250 names 190
 * times — and matches the previous policy's granularity, which was global anyway.
 */
function inheritedDomAttributes(components: ComponentEntry[]): string[] {
  const union = new Set<string>()
  for (const c of components) {
    const display = c.meta?.name
    if (display === undefined) continue
    const tsx = (c.files ?? [])
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => {
        const i = f.indexOf('/packages/')
        return i === -1 ? f : f.slice(i + 1)
      })
    if (tsx.length === 0) continue
    const sets = resolvePropSets(tsx, `${display}Props`)
    if (!sets) continue
    for (const name of sets.resolvedAll) {
      if (!sets.declaredOwn.has(name)) union.add(name)
    }
  }
  return [...union].sort()
}

const domAttributes = inheritedDomAttributes(registry.components)

const contract = {
  /** Registry version this contract was cut from — reported by `audit --verbose`. */
  version: registry.version,
  tokens: catalog.tokens
    .filter((t) => t.resolvedDefault != null)
    .map((t) => ({ name: t.name, resolvedDefault: t.resolvedDefault })),
  components: registry.components
    .filter((c) => c.meta)
    .map((c) => ({
      name: c.meta!.name,
      props: (c.meta!.props ?? []).map((p) => ({
        name: p.name,
        type: p.type ?? '',
        required: Boolean(p.required),
      })),
    })),
  /**
   * DOM attributes cascivo components inherit and spread. Valid on any component that
   * extends a React `*HTMLAttributes` base — which is nearly all of them — and previously
   * a hand-maintained 48-name list that produced false `unknown-prop` errors.
   */
  domAttributes,
  /** Components declaring user-facing chrome text, for the i18n rule. */
  content: (context.components ?? []).filter((c) => c.intent?.content).map((c) => c.name),
  /**
   * Typography primitives whose children are the page's authored prose. The `raw-string`
   * rule must skip them: `<Text>Automatic deployments</Text>` is page copy, not a component
   * label, and warning on it fires once per sentence in a real app.
   */
  contentPrimitives: (context.components ?? [])
    .filter((c) => c.intent?.content?.contentPrimitive === true)
    .map((c) => c.name),
}

const json = JSON.stringify(contract)
const targets = [
  join(REPO_ROOT, 'packages/cli/src/generated/audit-contract.json'),
  join(REPO_ROOT, 'apps/site/public/audit-contract.json'),
]
for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, json)
}

console.log(
  `Wrote audit-contract.json (${Math.round(json.length / 1024)} KB): ` +
    `${contract.tokens.length} tokens, ${contract.components.length} components, ` +
    `${contract.domAttributes.length} inherited DOM attributes, ` +
    `${contract.content.length} with chrome text ` +
    `(${contract.contentPrimitives.length} typography primitives)`,
)
