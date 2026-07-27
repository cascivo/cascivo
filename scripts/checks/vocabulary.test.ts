/**
 * Prop-vocabulary guard.
 *
 * For a design system whose pitch is AI-first, prop-value predictability *is* the product:
 * an agent that can't predict the value pays a compile round-trip per component. Four
 * display components shipped four overlapping severity enums (`destructive` vs `error`;
 * `Badge` with no `info`; `Status` with no `destructive`; `Notification` with no `neutral`),
 * and two sequence components shipped two names for the same three states
 * (`current`/`active`, `upcoming`/`pending`).
 *
 * `@cascivo/core`'s `Tone` and `Progress` are now the canonical vocabularies. This asserts
 * every component that models either accepts the whole canonical set — so a new component
 * can't reintroduce a private dialect, and an existing one can't quietly drop a value.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const COMPONENTS = join(ROOT, 'packages', 'components', 'src')

/** Components that model severity. Each must accept the whole `Tone` union. */
const TONE_COMPONENTS = ['badge', 'tag', 'status', 'notification']
/** Components that model position in a sequence. Each must accept the whole `Progress` union. */
const PROGRESS_COMPONENTS = ['timeline', 'steps']

function source(name: string): string {
  return readFileSync(join(COMPONENTS, name, `${name}.tsx`), 'utf8')
}

describe('severity vocabulary is shared', () => {
  for (const name of TONE_COMPONENTS) {
    it(`${name} accepts the canonical Tone union`, () => {
      const code = source(name)
      assert.match(
        code,
        /ToneInput/,
        `${name} models severity, so its tone prop must be typed \`ToneInput\` (from @cascivo/core) ` +
          'rather than a private union — otherwise one domain enum needs a per-component lookup table',
      )
      assert.match(
        code,
        /normalizeTone/,
        `${name} must run its tone through \`normalizeTone\` so the alias spellings ` +
          '(`destructive`/`error` → `danger`, `default` → `neutral`) resolve to what its stylesheet keys on',
      )
    })

    it(`${name} maps every canonical tone to a stylesheet value`, () => {
      const code = source(name)
      const block = /const TONE_CLASS[\s\S]*?\n\}/.exec(code)
      assert.ok(block, `${name} must declare a TONE_CLASS map from canonical tone → its CSS value`)
      for (const tone of ['neutral', 'info', 'success', 'warning', 'danger']) {
        assert.match(
          block[0],
          new RegExp(`\\b${tone}:`),
          `${name}'s TONE_CLASS is missing the canonical tone \`${tone}\``,
        )
      }
    })
  }
})

describe('progress vocabulary is shared', () => {
  for (const name of PROGRESS_COMPONENTS) {
    it(`${name} accepts the canonical Progress union plus aliases`, () => {
      const code = source(name)
      assert.match(
        code,
        /ProgressInput/,
        `${name} models position in a sequence, so its state prop must be typed \`ProgressInput\` ` +
          "(from @cascivo/core) — `state: 'upcoming'` on Steps was a type error with no hint that " +
          '`pending` was the word',
      )
      assert.match(
        code,
        /normalizeProgress/,
        `${name} must run its state through \`normalizeProgress\` so \`current\`/\`upcoming\` resolve`,
      )
    })
  }
})

describe('accessible-name spelling is not a coin flip', () => {
  // Components that previously took only the DOM spelling. `ariaLabel` is the catalog
  // convention; both must work so either guess compiles.
  for (const name of ['filter', 'structured-list', 'progress']) {
    it(`${name} accepts both ariaLabel and aria-label`, () => {
      const code = source(name)
      assert.match(code, /\bariaLabel\?: string/, `${name} must accept the \`ariaLabel\` spelling`)
      assert.match(
        code,
        /'aria-label'\?: string/,
        `${name} must keep accepting the DOM \`aria-label\` spelling`,
      )
    })
  }
})

describe('item identity is not a coin flip', () => {
  it('OverflowMenu accepts `id` as an alias of `value`', () => {
    const code = source('overflow-menu')
    assert.match(code, /\bid\?: string/, 'OverflowMenu items must accept `id` as well as `value`')
  })
})
