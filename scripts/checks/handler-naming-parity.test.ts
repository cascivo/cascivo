/**
 * Event-handler naming parity guard.
 *
 * `docs/AI-RULES.md` presents the event-handler table as a **predictive rule** — "predict
 * the prop without checking the types". That is a strong promise, and it was false: the
 * table listed `Select` (and `Slider`) in the `onValueChange` row, but both are native
 * element wrappers that only ever carried the DOM `onChange`. An adopter who trusted the
 * rule wrote `onValueChange` on a `Select`, got
 * `Property 'onValueChange' does not exist … Did you mean 'onVolumeChange'?`, and had to
 * dive into the `.d.ts`. Worse than an undocumented API: the documentation was confidently
 * wrong, so every component they had not individually verified was suspect too.
 *
 * `path-b-parity.test.ts` already applies this idea to primitive *names* (every primitive
 * the reactivity docs mention must be importable from `@cascivo/react`). This is the same
 * mechanism applied to prop *names*: every component named in the table must actually carry
 * the handler the table claims for it.
 *
 * Membership is checked against the resolved property set (inherited DOM attributes
 * included), because `onChange` legitimately arrives via `SelectHTMLAttributes` rather than
 * being declared by hand. `onValueChange` never comes from a DOM base, so for that row the
 * resolved set and the authored set agree.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { resolvePropSets } from './lib/component-props.ts'
import { resolveEntrySources } from './lib/registry-source.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const AI_RULES = join(REPO_ROOT, 'docs/AI-RULES.md')

interface RegistryComponent {
  name: string
  files?: string[]
  meta: { name: string }
}

/**
 * Rows whose "Examples" cell names concrete components. The `onClick` row is excluded on
 * purpose: it says "nav items, buttons", which are shapes rather than exported components.
 */
const CHECKED_HANDLERS = ['onValueChange', 'onChange', 'onSelect']

/** Table rows as [handler, componentNames]. Parsed from the doc, not hardcoded. */
function parseHandlerTable(): Array<[string, string[]]> {
  const md = readFileSync(AI_RULES, 'utf8')
  const rows: Array<[string, string[]]> = []
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1)
    if (cells.length < 3) continue
    const handler = /`(on[A-Z]\w*)\(/.exec(cells[1] ?? '')?.[1]
    if (handler === undefined || !CHECKED_HANDLERS.includes(handler)) continue
    // Backticked identifiers in the Examples cell; prose like "chart point clicks" is ignored.
    const names = [...(cells[2] ?? '').matchAll(/`([A-Z]\w+)`/g)].map((m) => m[1]!)
    if (names.length > 0) rows.push([handler, names])
  }
  return rows
}

function loadRegistry(): RegistryComponent[] {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: RegistryComponent[]
    blocks?: RegistryComponent[]
  }
  return [...registry.components, ...(registry.blocks ?? [])]
}

/**
 * Resolved property names for a component's `<Pascal>Props`, or null if unresolvable.
 *
 * Sub-components (`MenuItem`, `ContextMenuItem`) are not registry entries of their own —
 * they ship inside the parent's `.tsx`. They matter here because that is where several
 * handlers actually live, so resolve them from the longest matching parent entry rather
 * than reporting them missing.
 */
function propsOf(displayName: string): Set<string> | null {
  const registry = loadRegistry()
  const nameOf = (c: RegistryComponent) => c.meta?.name ?? c.name
  const entry =
    registry.find((c) => nameOf(c) === displayName) ??
    registry
      .filter((c) => displayName.startsWith(nameOf(c)))
      .sort((a, b) => nameOf(b).length - nameOf(a).length)[0]
  if (!entry) return null
  // Fourth consumer of the `files[]` dead branch, found by the 2026-08-14 sweep. `files[]` is
  // empty for every npm-shipped entry (charts, flow, editor), so this returned null for all of
  // them and the handler-naming rule was never checked against a single chart.
  const tsx = resolveEntrySources(REPO_ROOT, entry)
  if (tsx.length === 0) return null
  return resolvePropSets(tsx, `${displayName}Props`)?.resolvedAll ?? null
}

describe('handler-naming-parity — the documented rule matches the types', () => {
  const table = parseHandlerTable()

  it('parses the event-handler table out of AI-RULES.md', () => {
    assert.ok(
      table.length >= 3,
      `Expected at least the onValueChange/onChange/onSelect rows; parsed ${table.length}. ` +
        'If the table was reformatted, update parseHandlerTable().',
    )
  })

  it('every component named in the table carries the handler it claims', () => {
    const violations: string[] = []
    const unresolved: string[] = []

    for (const [handler, names] of table) {
      for (const name of names) {
        const props = propsOf(name)
        if (props === null) {
          unresolved.push(`${name} (${handler} row)`)
          continue
        }
        if (!props.has(handler)) {
          violations.push(
            `  ${name} is listed under \`${handler}\` but ${name}Props has no such prop.`,
          )
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      'docs/AI-RULES.md documents handler props that do not exist. The table is presented as a\n' +
        'predictive rule, so a wrong row teaches adopters to write code that cannot compile.\n' +
        'Either add the prop, or move the component to the row that matches its real API:\n' +
        violations.join('\n'),
    )
    // Unresolvable entries would silently hollow out the guard.
    assert.deepEqual(
      unresolved,
      [],
      `Could not resolve props for: ${unresolved.join(', ')}. A component named in the table\n` +
        'must be resolvable, or the guard passes vacuously for it.',
    )
  })

  it('no component appears in two different handler rows', () => {
    // A component in both rows makes the rule unpredictable in exactly the way it promises
    // not to be, even though both props would resolve.
    const seen = new Map<string, string>()
    const dupes: string[] = []
    for (const [handler, names] of table) {
      for (const name of names) {
        const prior = seen.get(name)
        if (prior !== undefined && prior !== handler) {
          dupes.push(`${name} is listed under both \`${prior}\` and \`${handler}\``)
        } else seen.set(name, handler)
      }
    }
    assert.deepEqual(dupes, [], dupes.join('\n'))
  })
})
