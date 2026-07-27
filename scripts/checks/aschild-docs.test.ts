/**
 * `asChild` doc-coverage guard.
 *
 * `asChild` is the only supported way to put cascivo styling on a router's link, and an
 * adopter who can't find it hand-rolls the CSS from tokens (reported twice — see
 * docs/internal/feedback/fix-plan-adopter-pair-2026-07-26.md WS-3). The escape hatch existed
 * on 8 components and appeared in zero guides.
 *
 * This is the Mechanism-D guard for that fact: the set of components that accept `asChild` is
 * derived from the source, and the router guide's table must list exactly that set. A
 * component that gains `asChild` without a doc row fails here.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const GUIDE = join(ROOT, 'docs', 'USING-WITH-A-ROUTER.md')
const SOURCE_DIRS = [
  join(ROOT, 'packages', 'components', 'src'),
  join(ROOT, 'packages', 'layouts', 'src'),
]

/** Components whose exported `…Props` interface declares an `asChild` prop. */
function componentsWithAsChild(): string[] {
  const found = new Set<string>()
  for (const dir of SOURCE_DIRS) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const file = join(dir, entry.name, `${entry.name}.tsx`)
      let source: string
      try {
        source = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      // Count the prop on any `…Props` interface in the file, exported or not:
      // several components (IconButton) declare a private base interface carrying
      // `asChild` and export a XOR union built from it, so requiring `export` here
      // silently drops them — the exact false-negative shape this guard exists to
      // prevent. The component's public name is derived from the interface name.
      for (const match of source.matchAll(/interface (\w+)Props\b[\s\S]*?\n\}/g)) {
        if (!/\n\s*asChild\?:/.test(match[0])) continue
        // `IconButtonBaseProps` → `IconButton`
        found.add(match[1]!.replace(/Base$/, ''))
      }
    }
  }
  return [...found].sort()
}

/** Component names in the generated block of the router guide's support table. */
function documentedComponents(): string[] {
  const guide = readFileSync(GUIDE, 'utf8')
  const block =
    /<!-- generated: asChild-support -->([\s\S]*?)<!-- \/generated: asChild-support -->/.exec(guide)
  assert.ok(block, 'USING-WITH-A-ROUTER.md is missing the asChild-support generated block')
  return [...block[1]!.matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]!).sort()
}

describe('asChild doc coverage', () => {
  it('every component accepting asChild is listed in the router guide', () => {
    const source = componentsWithAsChild()
    const documented = documentedComponents()
    assert.ok(source.length > 0, 'no asChild components found — the source scan is broken')

    const undocumented = source.filter((c) => !documented.includes(c))
    assert.deepEqual(
      undocumented,
      [],
      `these components accept \`asChild\` but are missing from the table in docs/USING-WITH-A-ROUTER.md: ${undocumented.join(', ')}`,
    )

    const stale = documented.filter((c) => !source.includes(c))
    assert.deepEqual(
      stale,
      [],
      `docs/USING-WITH-A-ROUTER.md lists these as \`asChild\`-capable but the source disagrees: ${stale.join(', ')}`,
    )
  })

  it('Link supports asChild — the in-content router-link path', () => {
    assert.ok(
      componentsWithAsChild().includes('Link'),
      '`Link` must accept `asChild`; without it a routed app has no supported way to style an in-content link',
    )
  })
})

/**
 * Controls that are NOT links but can be rendered as one via `asChild`. The browser's
 * `a[href]` underline and the fact that an `<a>` can never match `:disabled` are the two
 * ways a control silently changes appearance/behavior when it becomes an anchor — an
 * adopter measured a `Button asChild` anchor rendering `text-decoration: underline` while
 * the real `<button>` rendered `none`.
 */
const CONTROL_LIKE: Array<{ component: string; css: string; rule: string }> = [
  { component: 'Button', css: 'packages/components/src/button/button.module.css', rule: 'button' },
  {
    component: 'IconButton',
    css: 'packages/components/src/icon-button/icon-button.module.css',
    rule: 'iconButton',
  },
  { component: 'Item', css: 'packages/components/src/item/item.module.css', rule: 'item' },
  { component: 'Tile', css: 'packages/components/src/tile/tile.module.css', rule: 'tile' },
]

describe('asChild anchor contract', () => {
  for (const { component, css, rule } of CONTROL_LIKE) {
    it(`${component} kills the UA anchor underline`, () => {
      const source = readFileSync(join(ROOT, css), 'utf8')
      const block = new RegExp(`\\.${rule}\\s*\\{[\\s\\S]*?\\n  \\}`).exec(source)
      assert.ok(block, `could not find the .${rule} rule block in ${css}`)
      assert.match(
        block[0],
        /text-decoration:\s*none/,
        `${component} can be rendered as an <a> via asChild, so .${rule} must set \`text-decoration: none\` — otherwise the UA underline survives on the anchor`,
      )
    })
  }

  for (const { component, css } of CONTROL_LIKE) {
    it(`${component} styles aria-disabled the same as :disabled`, () => {
      const source = readFileSync(join(ROOT, css), 'utf8')
      if (!source.includes('&:disabled')) return // no disabled visuals to mirror
      assert.match(
        source,
        /&:disabled,\s*\n\s*&\[aria-disabled='true'\]/,
        `${component} has a :disabled rule but no matching [aria-disabled='true'] — an <a> rendered via asChild can never match :disabled`,
      )
    })
  }
})
