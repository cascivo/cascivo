/**
 * Every link-shaped config item type exposes a stable `id`.
 *
 * Config-driven nav components map over an array the adopter supplies, so they need a React
 * key. Keying on `href` looks fine until two entries share one — three sibling teams that all
 * link to `/`, or a row of placeholder `#` links — at which point React logs a duplicate-key
 * warning on every render and the adopter's only recourse is to make the hrefs artificially
 * distinct (2026-08-08 report A, `Switcher`).
 *
 * `SideNavItem`, `SideNavLinkSubItem`, `ShellHeaderNavLink`, `ShellHeaderNavMenuItem`,
 * `HeaderLink` and `CommandItem` all gained `id` in an earlier sweep. `Switcher` was missed —
 * Mechanism D, a fix that landed on some surfaces and not all of them. A sweep is only worth
 * doing once if something keeps it swept.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const COMPONENTS = join(ROOT, 'packages', 'components', 'src')

/** Interfaces that describe one entry in a config-driven list of links. */
const LINK_ITEM_TYPES: Array<{ file: string; type: string }> = [
  { file: 'side-nav/side-nav.tsx', type: 'SideNavItem' },
  { file: 'side-nav/side-nav.tsx', type: 'SideNavLinkSubItem' },
  { file: 'shell-header/shell-header.tsx', type: 'ShellHeaderNavLink' },
  { file: 'shell-header/shell-header.tsx', type: 'ShellHeaderNavMenuItem' },
  { file: 'switcher/switcher.tsx', type: 'SwitcherLink' },
]

/** Body of `export interface <name> { … }`, brace-matched. */
function interfaceBody(source: string, name: string): string | null {
  const start = source.search(new RegExp(`export interface ${name}\\b[^{]*\\{`))
  if (start === -1) return null
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

describe('link-item id parity', () => {
  for (const { file, type } of LINK_ITEM_TYPES) {
    it(`${type} exposes an \`id\` escape hatch`, () => {
      const source = readFileSync(join(COMPONENTS, file), 'utf8')
      const body = interfaceBody(source, type)
      assert.ok(body, `${type} not found in ${file} — was it renamed?`)
      assert.match(
        body,
        /^\s*id\?: string/m,
        `${type} has no \`id\`, so its component must key on \`href\` or \`label\`. Two entries ` +
          'sharing one (placeholder `#` links, sibling teams that all link to `/`) then produce ' +
          'React duplicate-key warnings the adopter can only fix by distorting their data.',
      )
    })
  }

  it('components key on `id` before falling back', () => {
    // Declaring the field is half the fix; the render has to prefer it.
    const source = readFileSync(join(COMPONENTS, 'switcher/switcher.tsx'), 'utf8')
    assert.match(
      source,
      /key=\{entry\.id \?\? entry\.href\}/,
      'Switcher declares `id` but still keys on href alone',
    )
  })
})
