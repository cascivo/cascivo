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
import { readFileSync, readdirSync, statSync } from 'node:fs'
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

describe('the accessible-name prop is one name, everywhere', () => {
  /**
   * Every component that accepts the DOM spelling `aria-label` as a declared prop must
   * also accept `ariaLabel`, the catalog's name for an invisible accessible name.
   *
   * Two spellings of one idea inside one package is a coin flip on every component, and an
   * adopter reported paying it: `label` sometimes meant visible text, sometimes an
   * invisible name, and sometimes was not accepted at all. AI-RULES.md now states the rule
   * for the whole catalog, so it has to actually hold for the whole catalog.
   */
  const DUAL_SPELLING = [
    ['components', 'filter'],
    ['components', 'structured-list'],
    ['components', 'progress'],
    ['components', 'menubar'],
    ['components', 'navigation-menu'],
    ['components', 'tree-view'],
    ['components', 'swap'],
    ['components', 'radial-progress'],
    ['layouts', 'split-view'],
    ['layouts', 'sections/stats-band'],
  ] as const

  for (const [pkg, name] of DUAL_SPELLING) {
    it(`${name} accepts ariaLabel alongside aria-label`, () => {
      const file = join(ROOT, `packages/${pkg}/src/${name}/${name.split('/').pop()}.tsx`)
      const code = readFileSync(file, 'utf8')
      assert.match(
        code,
        /\bariaLabel\??:\s*string/,
        `${name} declares 'aria-label' but not ariaLabel — the catalog convention.`,
      )
    })
  }

  it('no component declares aria-label WITHOUT the ariaLabel alias', () => {
    // The list above is a fixture; this is the sweep that catches a new one.
    const offenders: string[] = []
    for (const pkg of ['components', 'layouts']) {
      for (const file of tsxFiles(join(ROOT, `packages/${pkg}/src`))) {
        const code = readFileSync(file, 'utf8')
        if (!/^\s+'aria-label'\??:\s*string/m.test(code)) continue
        if (/\bariaLabel\??:\s*string/.test(code)) continue
        offenders.push(file.slice(ROOT.length + 1))
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `These declare 'aria-label' but not ariaLabel:\n  ${offenders.join('\n  ')}`,
    )
  })
})

/** Component `.tsx` files under a directory, excluding tests. */
function tsxFiles(dir: string): string[] {
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) out.push(full)
  }
  return out
}
