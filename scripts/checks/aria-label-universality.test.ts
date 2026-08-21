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
