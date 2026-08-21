/**
 * `nameVisibility` parity — the declaration must match the JSX.
 *
 * `docs/AI-RULES.md` has stated for months that `label` is visible unless its description
 * says otherwise, and `vocabulary.test.ts` claimed to enforce it. It did so by regex-matching
 * the manifest description for words like "visible" or "accessible name" — and its VISIBLE
 * pattern contained the substring `text label`. `Switcher` and `CommandMenu` both describe
 * their **invisible** accessible names as "Text label for the control.", so the guard passed
 * while certifying the opposite of the truth on the exact two components a 2026-08-21 adopter
 * tripped over.
 *
 * A guard whose predicate is prose will eventually assert a lie. The predicate is now the
 * structured `PropMeta.nameVisibility` field, and this file closes the remaining gap: the
 * field is checked against where the component's own JSX actually puts the value, in both
 * directions. Declaring `'visible'` on a prop that only reaches `aria-label` fails; declaring
 * `'invisible'` on a prop that is painted fails.
 *
 * Where the value is handed to another component (`<Tooltip label={label}>`), the classifier
 * reports `'unknown'` and this guard says nothing. That is deliberate: a checker that invents
 * a verdict for what it cannot see is the failure mode being removed, not a stricter version
 * of it. `vocabulary.test.ts` still requires the field to be declared for those.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { classifyNameVisibility } from './lib/name-visibility.ts'
import { resolveEntrySources } from './lib/registry-source.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface Entry {
  name: string
  files?: string[]
  meta: { props?: { name: string; nameVisibility?: 'visible' | 'invisible' }[] }
}

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: Entry[]
}

describe('nameVisibility matches the component source', () => {
  const mismatches: string[] = []
  let checked = 0

  for (const entry of registry.components) {
    const props = (entry.meta.props ?? []).filter(
      (p) => p.name === 'label' || p.name === 'ariaLabel',
    )
    if (props.length === 0) continue
    const sources = resolveEntrySources(ROOT, entry).map((rel) => join(ROOT, rel))
    if (sources.length === 0) {
      mismatches.push(`${entry.name}: no source resolved — investigate, do not skip`)
      continue
    }
    for (const prop of props) {
      const actual = classifyNameVisibility(sources, prop.name)
      if (actual === 'unknown') continue
      checked++
      if (prop.nameVisibility && prop.nameVisibility !== actual) {
        mismatches.push(
          `${entry.name}.${prop.name}: manifest says '${prop.nameVisibility}', the JSX puts it ` +
            `in ${actual === 'visible' ? 'a painted child' : 'an aria-label attribute'} position`,
        )
      }
    }
  }

  it('every declared label/ariaLabel prop is declared as the source renders it', () => {
    assert.deepEqual(
      mismatches,
      [],
      'A `nameVisibility` declaration disagrees with the component. Fix whichever is wrong — ' +
        'the manifest flows to registry.json, llms.txt and the docs site, so a wrong one is ' +
        'read by every agent:\n  ' +
        mismatches.join('\n  '),
    )
  })

  it('the classifier resolved a verdict for most of the catalog', () => {
    // A classifier that quietly degraded to 'unknown' everywhere would make the test above
    // vacuous while still reporting green — the same shape of failure this whole guard
    // replaces. 40 is well under the current count and well over "it broke".
    assert.ok(
      checked >= 40,
      `Only ${checked} label/ariaLabel props could be classified from source. The classifier ` +
        'has regressed; the parity assertion above is now vacuous.',
    )
  })
})
