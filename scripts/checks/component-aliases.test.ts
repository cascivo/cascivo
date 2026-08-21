/**
 * Component foreign-name map — every alias resolves, nothing collides.
 *
 * `packages/components/aliases.json` maps the names peer systems use (Radix, MUI, Chakra,
 * shadcn, HeadlessUI, Carbon) onto cascivo registry entries, so an agent that guesses a
 * familiar name is answered instead of told the component does not exist. `Switch` is the
 * case that cost an adopter a lookup: every peer system calls the toggle switch `Switch`,
 * cascivo calls it `Toggle`, and `ToggleGroup` is a different component entirely
 * (2026-08-21 report item 3).
 *
 * The icon catalog has carried the same field for months and it works. The failure mode a
 * map like this has is rot — an alias pointing at a renamed component, or two aliases
 * claiming the same word — so it gets the same treatment `deprecation-surfaces.test.ts`
 * gives replacement names: the pointer must resolve, or the build fails.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const raw = JSON.parse(
  readFileSync(join(ROOT, 'packages/components/aliases.json'), 'utf8'),
) as Record<string, string[] | string>
const aliases = Object.entries(raw).filter((e): e is [string, string[]] => e[0] !== '_comment')

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: { name: string; aliases?: string[]; meta: { name: string } }[]
}
const byName = new Map(registry.components.map((c) => [c.name, c]))

describe('component aliases', () => {
  it('every alias target is a real registry entry', () => {
    const missing = aliases.map(([target]) => target).filter((t) => !byName.has(t))
    assert.deepEqual(
      missing,
      [],
      'These alias targets do not exist in registry.json. An alias that points at nothing is ' +
        'worse than no alias — it turns a wrong guess into a confident wrong answer:\n  ' +
        missing.join('\n  '),
    )
  })

  it('no alias shadows a real component name', () => {
    const real = new Set(registry.components.map((c) => c.name.toLowerCase()))
    const shadows = aliases.flatMap(([target, names]) =>
      names.filter((n) => real.has(n.toLowerCase())).map((n) => `${n} (aliased to ${target})`),
    )
    assert.deepEqual(
      shadows,
      [],
      'These aliases are also real component names, so `cascivo add <name>` would resolve to ' +
        'two different things depending on lookup order:\n  ' +
        shadows.join('\n  '),
    )
  })

  it('no two targets claim the same alias', () => {
    const claims = new Map<string, Set<string>>()
    for (const [target, names] of aliases) {
      for (const n of names) {
        const key = n.toLowerCase()
        if (!claims.has(key)) claims.set(key, new Set())
        claims.get(key)!.add(target)
      }
    }
    const collisions = [...claims.entries()]
      .filter(([, targets]) => targets.size > 1)
      .map(([name, targets]) => `${name} → ${[...targets].join(', ')}`)
    assert.deepEqual(
      collisions,
      [],
      'An alias claimed by two components resolves by whichever is found first, which is not ' +
        'a decision anyone made. Pick the closer match and drop the other:\n  ' +
        collisions.join('\n  '),
    )
  })

  it('registry.json carries the aliases (regen drift)', () => {
    const stale = aliases
      .filter(([target, names]) => {
        const entry = byName.get(target)
        if (!entry) return false
        const got = new Set(entry.aliases ?? [])
        return names.some((n) => !got.has(n))
      })
      .map(([target]) => target)
    assert.deepEqual(
      stale,
      [],
      'registry.json is missing aliases these entries declare. Run `pnpm regen` and commit:\n  ' +
        stale.join('\n  '),
    )
  })
})
