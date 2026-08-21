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

/*
 * ── Prop-NAME vocabulary ───────────────────────────────────────────────────────────────
 *
 * Everything above guards prop VALUES (the Tone and Progress unions). This guards prop
 * NAMES, which is where the 2026-08-08 adopter lost nine compile cycles: `shape` vs
 * `variant`, `rows` vs `items`, `type` vs `kind` as a union tag.
 *
 * Only the mechanically decidable rules live here. "Is this collection config-driven?" is a
 * judgement call made at review time against the table in docs/AI-RULES.md; "does a type
 * named `<X>Shape` correspond to a `shape` prop?" is not.
 */
describe('prop-name vocabulary', () => {
  const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
    components: Array<{
      name: string
      meta: {
        name: string
        props?: Array<{
          name: string
          type: string
          description?: string
          nameVisibility?: 'visible' | 'invisible'
        }>
      }
    }>
  }

  it('no component declares both `items` and `rows`', () => {
    const offenders = registry.components
      .filter((c) => {
        const names = new Set((c.meta.props ?? []).map((p) => p.name))
        return names.has('items') && names.has('rows')
      })
      .map((c) => c.name)
    assert.deepEqual(
      offenders,
      [],
      'A component taking both `items` and `rows` makes the collection prop a coin flip. ' +
        'Pick `items`; `DataTable.rows` is the one exception and it takes only `rows`.',
    )
  })

  /*
   * `label` is visible on ~25 components and an invisible accessible name on ~8. An adopter
   * who learned it from `Sparkline` (invisible, and explicit about it) reasonably assumed
   * `Toggle.label` was the same and got a string rendered next to the switch, duplicating the
   * settings row's own title (2026-08-14 §5).
   *
   * This used to be asserted by regex-matching the manifest description for words like
   * "visible" or "accessible name". That guard had a hole big enough to drive the reported
   * defect through: its VISIBLE pattern contained `text label`, and `Switcher` and
   * `CommandMenu` both describe their INVISIBLE names as "Text label for the control." — so
   * the guard passed while asserting the opposite of the truth on the exact two components a
   * 2026-08-21 adopter tripped over.
   *
   * The predicate is now the structured `nameVisibility` field. Prose cannot spoof it, and
   * `name-visibility-parity.test.ts` checks the declared value against the component's own
   * JSX, so it cannot drift from behaviour either.
   */
  it('every `label` and `ariaLabel` prop declares nameVisibility', () => {
    const undeclared = registry.components.flatMap((c) =>
      (c.meta.props ?? [])
        .filter((p) => (p.name === 'label' || p.name === 'ariaLabel') && !p.nameVisibility)
        .map((p) => `${c.name}.${p.name}`),
    )
    assert.deepEqual(
      undeclared,
      [],
      'These `label`/`ariaLabel` props do not declare `nameVisibility`. Both meanings exist ' +
        'in the catalog, so silence makes it a coin flip — and guessing wrong puts duplicate ' +
        "text on screen. Add `nameVisibility: 'visible' | 'invisible'` to the .meta.ts prop, " +
        'then `pnpm regen`:\n  ' +
        undeclared.join('\n  '),
    )
  })

  it('no `ariaLabel` prop claims to be visible', () => {
    const wrong = registry.components.flatMap((c) =>
      (c.meta.props ?? [])
        .filter((p) => p.name === 'ariaLabel' && p.nameVisibility !== 'invisible')
        .map((p) => `${c.name}.${p.name} = ${String(p.nameVisibility)}`),
    )
    assert.deepEqual(
      wrong,
      [],
      '`ariaLabel` is the catalog word for a name that is NEVER painted. A component that ' +
        'renders the string must call the prop `label`:\n  ' +
        wrong.join('\n  '),
    )
  })

  it('no component types a visual-style prop as `shape`', () => {
    // `variant` is the catalog word. `shape` survives only where it means literal geometry
    // (Avatar's circle/square), which is a shape, not a style enum.
    const GEOMETRY = new Set(['avatar', 'avatar-group', 'skeleton', 'spinner'])
    const offenders = registry.components
      .filter((c) => !GEOMETRY.has(c.name))
      .filter((c) => (c.meta.props ?? []).some((p) => p.name === 'shape'))
      .map((c) => c.name)
    assert.deepEqual(
      offenders,
      [],
      'Use `variant` for a visual-style enum. `shape` is reserved for literal geometry.',
    )
  })

  it('no exported type is named `<X>Shape` unless its component has a `shape` prop', () => {
    // The BadgeShape trap: a type named for a prop that does not exist sits directly above
    // the props interface in the generated .d.ts and reads as that prop's type.
    const offenders: string[] = []
    for (const file of tsxFiles(COMPONENTS)) {
      const code = readFileSync(file, 'utf8')
      for (const m of code.matchAll(/^(?:export )?type (\w+)Shape\b/gm)) {
        if (/^\s+shape\??:/m.test(code)) continue
        offenders.push(`${file.slice(ROOT.length + 1)}: ${m[1]}Shape`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'A type named `<X>Shape` next to a component with no `shape` prop is read as that ' +
        "prop's type — `BadgeShape` cost an adopter four files. Name the type after the " +
        'prop it actually types (`BadgeVariant`).',
    )
  })

  it('discriminated-union props tag on `kind`, not `type`', () => {
    // Union-typed props whose manifest type string spells out an inline discriminant.
    const offenders: string[] = []
    for (const c of registry.components) {
      for (const p of c.meta.props ?? []) {
        if (!/\btype:\s*'/.test(p.type)) continue
        offenders.push(`${c.name}.${p.name}: ${p.type.slice(0, 60)}`)
      }
    }
    assert.deepEqual(
      offenders,
      [],
      'Discriminated unions tag on `kind`. `type` is reserved for HTML-ish meanings ' +
        "(`input type`, renderer keys). An adopter wrote `{ type: 'line' }` for " +
        'AreaChart.annotations and had to discover the tag was `kind`.',
    )
  })

  it('every row of the published vocabulary table names a real prop', () => {
    // Keeps the docs from rotting: the table in AI-RULES.md is the contract, so each
    // component it names must actually carry the prop it is cited for.
    const claims: Array<[string, string]> = [
      ['data-list', 'items'],
      ['structured-list', 'items'],
      ['timeline', 'items'],
      ['data-table', 'rows'],
      ['badge', 'variant'],
      ['notification', 'actions'],
      ['notification', 'description'],
      ['app-shell', 'padding'],
    ]
    const missing: string[] = []
    for (const [comp, prop] of claims) {
      const c = registry.components.find((x) => x.name === comp)
      if (!c) {
        missing.push(`${comp} (no registry entry)`)
        continue
      }
      if (!(c.meta.props ?? []).some((p) => p.name === prop)) missing.push(`${comp}.${prop}`)
    }
    assert.deepEqual(
      missing,
      [],
      'docs/AI-RULES.md "Data and shape props" cites props that do not exist:\n  ' +
        missing.join('\n  '),
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
