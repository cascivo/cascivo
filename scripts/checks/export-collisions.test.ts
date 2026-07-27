/**
 * Cross-package export-collision guard.
 *
 * A dashboard file routinely imports from `@cascivo/react`, `@cascivo/charts` and
 * `@cascivo/icons` at once. Three names exist in more than one of them, so such a file needs
 * aliasing — and nothing breaks loudly: `Text` silently resolving to the SVG chart primitive
 * instead of the typography component is a bad afternoon, not a compile error.
 *
 * The existing set is recorded below with the reason each is tolerated. This guard's job is
 * narrow and deliberate: **fail on a NEW collision.** Renaming the current ones is a breaking
 * change and is tracked separately (07-26 plan WS-13); shipping a *fourth* one is not.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { exportedNamesOf, reactExportedNames } from '../registry/react-exports.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

/**
 * Known collisions, with why each is tolerated for now. A name here that is NO LONGER a
 * collision must be removed (the stale-entry test below enforces that), and a name that is
 * not here fails the build.
 */
const KNOWN: Record<string, string> = {
  Text: 'charts ships an SVG <text> primitive; @cascivo/react ships the typography component',
  Calendar:
    'charts ships the calendar-heatmap chart; @cascivo/react ships the date-picker calendar',
}

/**
 * Current count of `@cascivo/icons` names that also name a component or chart. An icon set of
 * ~440 nouns will always contain some (`Search`, `Filter`, `Grid`, `User`, `BarChart`,
 * `PieChart`, …) — the convention is `import { Search as SearchIcon }`. Enumerating them
 * would be noise; capping the count catches a *new* one, which is the part that is avoidable.
 */
const ICON_OVERLAP_CEILING = 20

/** Top-level export names of a package's entry module (one level of `export *` followed). */
function packageExports(entry: string): Set<string> {
  const file = join(ROOT, entry)
  const src = readFileSync(file, 'utf8')
  const names = new Set(exportedNamesOf(file))
  for (const m of src.matchAll(/export\s+\*\s+from\s+'(\.[^']+)'/g)) {
    const spec = m[1]!.replace(/\.(ts|tsx)$/, '')
    for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
      const resolved = join(file, '..', spec + ext)
      if (!existsSync(resolved)) continue
      for (const name of exportedNamesOf(resolved)) names.add(name)
      break
    }
  }
  return names
}

/** Only value exports matter for a JSX name clash; type-only names never collide at runtime. */
function componentNames(names: Set<string>): Set<string> {
  return new Set([...names].filter((n) => /^[A-Z]/.test(n) && !/Props$|Options$|Config$/.test(n)))
}

/**
 * `@cascivo/icons` is deliberately out of scope. An icon set of ~440 nouns will always share
 * names with a component set (`Search`, `Filter`, `Grid`, `User`) and with a chart set
 * (`BarChart`, `PieChart`, `Gauge`, `Heatmap`, `Radar`) — Lucide and Heroicons have the same
 * property, and the convention is `import { Search as SearchIcon }`. Enumerating those would
 * be noise that buries the real signal.
 *
 * What is NOT inherent is two *component* packages claiming one name, where a wrong
 * resolution is silent: `Text` from `@cascivo/charts` is an SVG `<text>` primitive and
 * renders nothing useful where the typography component was meant. That is what this checks.
 */
describe('cross-package export collisions', () => {
  const react = componentNames(reactExportedNames(ROOT))
  const charts = componentNames(packageExports('packages/charts/src/index.ts'))
  const icons = componentNames(packageExports('packages/icons/src/index.tsx'))

  it('resolves a plausible number of exports from each package', () => {
    assert.ok(react.size > 100, `@cascivo/react resolved only ${react.size} exports`)
    assert.ok(charts.size > 20, `@cascivo/charts resolved only ${charts.size} exports`)
    assert.ok(icons.size > 0, `@cascivo/icons resolved only ${icons.size} exports`)
  })

  it('introduces no NEW collision between @cascivo/react and @cascivo/charts', () => {
    const collisions = new Set<string>()
    for (const name of charts) if (react.has(name)) collisions.add(name)

    const added = [...collisions].filter((n) => KNOWN[n] === undefined).sort()
    assert.deepEqual(
      added,
      [],
      'These names are now exported by more than one cascivo package a dashboard imports ' +
        'together, so any file using both needs an alias — and a wrong resolution is silent, ' +
        'not a compile error. Rename one side, or move it to a subpath export:\n' +
        `${added.map((n) => `  ${n}`).join('\n')}`,
    )
  })

  /**
   * Icons overlap with components by nature, so the set can't be zero — but it must not grow
   * unnoticed. A *new* component named after an existing icon (or vice versa) is a real
   * hazard: an adopter who writes `<Search/>` after importing both gets whichever the
   * bundler resolved, silently. The count is a ratchet, not a ban.
   */
  it('the icons ↔ components overlap does not grow', () => {
    const overlap = [...icons].filter((n) => react.has(n) || charts.has(n)).sort()
    assert.ok(
      overlap.length <= ICON_OVERLAP_CEILING,
      `The @cascivo/icons ↔ component overlap grew to ${overlap.length} (ceiling ` +
        `${ICON_OVERLAP_CEILING}). A new name here means \`import { X }\` from two packages ` +
        `resolves silently to one of them. Either rename, or raise the ceiling deliberately ` +
        `and note why.\n  ${overlap.join(', ')}`,
    )
    // Keep the ceiling honest: if the overlap shrank, the ceiling should follow.
    assert.ok(
      overlap.length >= ICON_OVERLAP_CEILING - 3,
      `The overlap dropped to ${overlap.length}, well under the ${ICON_OVERLAP_CEILING} ` +
        'ceiling — lower the ceiling so it keeps its grip.',
    )
  })

  it('the known-collision list has no stale entries', () => {
    const collisions = new Set<string>()
    for (const name of charts) if (react.has(name)) collisions.add(name)

    const stale = Object.keys(KNOWN).filter((n) => !collisions.has(n))
    assert.deepEqual(
      stale,
      [],
      `These names are no longer collisions — remove them from KNOWN:\n${stale.map((n) => `  ${n}`).join('\n')}`,
    )
  })
})
