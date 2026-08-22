/**
 * `ariaLabel` universality — one idea, both spellings, everywhere it exists.
 *
 * The catalog split three ways on the name of an invisible accessible name, and an adopter
 * paid a compile cycle on it: `<OverflowMenu label=…>` (it took only `ariaLabel`), while
 * `Switcher` and `CommandMenu` took only `label`, and `IconButton`/`Sparkline` took both
 * (2026-08-21 report item 1). Three spellings of one idea inside one package is a coin flip
 * on every component, and the per-component pages were correct the whole time — the cost was
 * that the convention was never mechanically true.
 *
 * The rule, stated so it is always safe to follow:
 *
 *   **A name nothing paints is spelled `ariaLabel` OR `label`, and every component that
 *   accepts one accepts the other.** `ariaLabel` is the convention and stays preferred;
 *   `label` is the guess, and a guess that compiles costs nobody anything.
 *
 * Deliberately NOT in scope: components that spread `...props` onto a real `<input>` /
 * `<select>` and never name themselves. Those already accept the standard DOM `aria-label`
 * through `HTMLAttributes` — typed, familiar, and not something a second camelCase spelling
 * would make more possible. The rule is about the props a component declares, which is
 * exactly what this reads.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface Prop {
  name: string
  nameVisibility?: 'visible' | 'invisible'
}
const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  components: { name: string; meta: { props?: Prop[] } }[]
}

/**
 * Components whose invisible name has no `label` spelling, with the reason. Not a place to
 * park work: each entry says why `label` would be a worse API here, not why it is unfinished.
 */
/**
 * Components with a VISIBLE `label` for which an invisible-name alias makes no sense, with the
 * reason. The 2026-08-22 sweep covered the form controls — the place a heading outside the
 * component legitimately replaces the visible label. It deliberately did not cover display and
 * chart widgets: you would never render a `Stat` or a `Kpi` with no visible label, so an
 * `ariaLabel` there is surface without capability, which is exactly the objection the
 * 2026-08-21 plan raised and which holds for these.
 */
const NO_VISIBLE_LABEL_ALIAS: Record<string, string> = {
  field: 'it IS the labelling mechanism — its `label` names the child control',
  stat: 'a stat with no visible label is meaningless; the label is the metric name',
  'chart/kpi': 'same as Stat — the label is the metric name',
  'chart/meter': 'the label is the metric name and is always painted',
  'chart/bullet': 'the label is the metric name and is always painted',
  'chart/histogram': 'the label is the x-axis title, which is always painted',
  'inline-loading': 'the label is the status text being announced and shown',
  'progress-bar': 'the label is the visible caption above the track',
  'contained-list': 'the label is the visible list heading',
  'flow/flow-edge': 'the label is painted on the edge in the canvas',
  'header-panel': 'the label is the visible panel heading',
  'menu-button': 'the label is the visible button text',
}

const NO_LABEL_ALIAS: Record<string, string> = {
  'data-table':
    'its visible name is `title` (a caption above the table), not `label` — a third spelling for the same idea is what this guard exists to prevent',
  menubar:
    'the name is required and typed as an XOR of `ariaLabel` / `aria-label`, so a third member would let two names be passed at once',
}

describe('an invisible accessible name is spelled both ways', () => {
  it('every component taking an invisible `label` also takes `ariaLabel`', () => {
    const offenders = registry.components
      .filter((c) => {
        const props = c.meta.props ?? []
        const label = props.find((p) => p.name === 'label')
        return label?.nameVisibility === 'invisible' && !props.some((p) => p.name === 'ariaLabel')
      })
      .map((c) => c.name)
    assert.deepEqual(
      offenders,
      [],
      'These take an invisible accessible name spelled only `label`. An agent that learned ' +
        '`ariaLabel` from any other component gets a type error for no reason. Add it as an ' +
        'alias:\n  ' +
        offenders.join('\n  '),
    )
  })

  /**
   * The gap this closes.
   *
   * The rule above is scoped to an *invisible* `label`, and the 2026-08-21 sweep deliberately
   * exempted components that spread onto a real `<input>`/`<select>`: they already accept the
   * DOM `aria-label`, so a second camelCase spelling looked like surface without capability.
   *
   * That reasoning is right about capability and wrong about discovery. `aria-label` arriving
   * through a spread appears in no props table, no `llms/<name>.md`, and nowhere beside
   * `label` in the `.d.ts` — so an adopter who believes `label` is the invisible name (the
   * prior `IconButton` and `Sparkline` teach) has nothing to read that contradicts them. One
   * wrote the canonical settings row and got the label printed twice (2026-08-22 report item
   * 13).
   *
   * A declared `ariaLabel` sitting next to `label`, each carrying its generated
   * "Rendered on screen." / "Not rendered — screen readers only." suffix, is the contrast that
   * interrupts the wrong guess. So: **a component that DECLARES `label` owes the other
   * spelling, whichever way its `label` renders.**
   */
  it('every component declaring a visible `label` also takes `ariaLabel`', () => {
    const offenders = registry.components
      .filter((c) => {
        if (c.name in NO_VISIBLE_LABEL_ALIAS) return false
        const props = c.meta.props ?? []
        const label = props.find((p) => p.name === 'label')
        return label?.nameVisibility === 'visible' && !props.some((p) => p.name === 'ariaLabel')
      })
      .map((c) => c.name)
    assert.deepEqual(
      offenders,
      [],
      'These render a VISIBLE `label` and offer no declared way to set an invisible name, so ' +
        'the only escape hatch is an undiscoverable spread `aria-label`. Add `ariaLabel`, or ' +
        'record in NO_VISIBLE_LABEL_ALIAS why an invisible name makes no sense here:\n  ' +
        offenders.join('\n  '),
    )
  })

  it('no NO_VISIBLE_LABEL_ALIAS entry is stale', () => {
    // An exclusion map rots into an allowlist the moment nobody checks it. Every entry must
    // name a component that still exists and still declares a visible `label`.
    const stale: string[] = []
    for (const name of Object.keys(NO_VISIBLE_LABEL_ALIAS)) {
      const entry = registry.components.find((c) => c.name === name)
      if (!entry) {
        stale.push(`${name} (no registry entry)`)
        continue
      }
      const label = (entry.meta.props ?? []).find((p) => p.name === 'label')
      if (label?.nameVisibility !== 'visible') {
        stale.push(`${name} (no longer declares a visible \`label\`)`)
      }
    }
    assert.deepEqual(stale, [], `Stale NO_VISIBLE_LABEL_ALIAS entries:\n  ${stale.join('\n  ')}`)
  })

  it('every component taking `ariaLabel` also takes `label`', () => {
    const offenders = registry.components
      .filter((c) => {
        const props = c.meta.props ?? []
        if (c.name in NO_LABEL_ALIAS) return false
        return props.some((p) => p.name === 'ariaLabel') && !props.some((p) => p.name === 'label')
      })
      .map((c) => c.name)
    assert.deepEqual(
      offenders,
      [],
      'These take `ariaLabel` but reject `label` — the exact type error a 2026-08-21 adopter ' +
        'hit on `<OverflowMenu label=…>`. Add `label` as an alias:\n  ' +
        offenders.join('\n  '),
    )
  })
})
