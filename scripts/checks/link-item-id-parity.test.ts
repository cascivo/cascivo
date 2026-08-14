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
 *
 * ## Why the subject list is DERIVED, not listed
 *
 * The first version of this guard enumerated its five subjects by hand — and then
 * `BreadcrumbItem` slipped through in exactly the same way `Switcher` had (2026-08-14 report
 * §9). A guard that enumerates its own subjects can only catch the instances its author
 * already knew about, which is the failure it was written to prevent, one level up.
 *
 * So the list is now discovered from the source shape: an exported interface with a `label`
 * and an optional `href` is a link-shaped config item, whatever it is called and wherever it
 * lives. The hand-written list survives only as a fixture asserting the discovery still finds
 * the known ones — if a rename makes the sweep silently return nothing, that fails too.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const COMPONENTS = join(ROOT, 'packages', 'components', 'src')

/**
 * Known link-shaped item types. This is a FIXTURE, not the subject list — the sweep below
 * discovers subjects from the source. Its job is to fail if discovery stops finding the ones
 * we already know about, so a rename cannot turn the sweep into a vacuous pass.
 */
const KNOWN_LINK_ITEM_TYPES = [
  'SideNavItem',
  'SideNavLinkSubItem',
  'ShellHeaderNavLink',
  'ShellHeaderNavMenuItem',
  'SwitcherLink',
  'BreadcrumbItem',
  'DockItem',
] as const

/**
 * Types that look link-shaped but are not rendered from an adopter-supplied array, with the
 * reason. An entry here is a decision, not a backlog item.
 */
const NOT_A_CONFIG_ITEM: Record<string, string> = {}

function tsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full))
    else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

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

interface Discovered {
  type: string
  file: string
  body: string
}

/**
 * Every exported interface in `packages/components` shaped like one entry of a config-driven
 * link list: it carries a `label` and an optional `href`.
 */
function discoverLinkItemTypes(): Discovered[] {
  const found: Discovered[] = []
  for (const path of tsxFiles(COMPONENTS)) {
    const source = readFileSync(path, 'utf8')
    for (const match of source.matchAll(/export interface (\w+)\b[^{]*\{/g)) {
      const type = match[1]!
      const body = interfaceBody(source, type)
      if (!body) continue
      // The shape: a human-readable label plus an optional destination. `href?` (not `href`)
      // because a trail's current crumb and a disabled nav row both omit it.
      if (!/^\s*label\??:/m.test(body)) continue
      if (!/^\s*href\??:/m.test(body)) continue
      found.push({ type, file: relative(COMPONENTS, path), body })
    }
  }
  return found
}

describe('link-item id parity', () => {
  const discovered = discoverLinkItemTypes()

  it('discovery still finds every known link-shaped type', () => {
    // The fixture half. If a rename or a shape change makes the sweep miss a type we already
    // fixed, this fails loudly instead of the sweep quietly checking fewer things.
    const names = new Set(discovered.map((d) => d.type))
    const missing = KNOWN_LINK_ITEM_TYPES.filter((t) => !names.has(t))
    assert.deepEqual(
      missing,
      [],
      `The link-item sweep no longer finds: ${missing.join(', ')}. Either they were renamed ` +
        '(update KNOWN_LINK_ITEM_TYPES) or the `label` + `href?` shape detection broke — in ' +
        'which case every other type is passing by never being checked.',
    )
  })

  it('every link-shaped config item exposes an `id` escape hatch', () => {
    const offenders = discovered
      .filter((d) => NOT_A_CONFIG_ITEM[d.type] === undefined)
      .filter((d) => !/^\s*id\??:\s*string/m.test(d.body))
      .map((d) => `${d.type} (${d.file})`)
    assert.deepEqual(
      offenders,
      [],
      'These types describe one entry of a config-driven link list but have no `id`, so their ' +
        'component must key on `href`, `label` or the array index. A real breadcrumb repeats ' +
        'hrefs ("Overview" and "Projects" both pointing at `/`), and an index key re-keys every ' +
        'row after a reorder or truncation.\n' +
        'Add `id?: string` and key on it, or record why it is not a config item in ' +
        `NOT_A_CONFIG_ITEM.\n  ${offenders.join('\n  ')}`,
    )
  })

  it('components key on `id` before falling back', () => {
    // Declaring the field is half the fix; the render has to prefer it. Checked per known
    // component, since the fallback expression differs (href, label, index).
    for (const [file, pattern] of [
      ['switcher/switcher.tsx', /key=\{entry\.id \?\? entry\.href\}/],
      ['breadcrumb/breadcrumb.tsx', /key=\{item\.id \?\? /],
      ['dock/dock.tsx', /key=\{item\.id \?\? /],
    ] as const) {
      assert.match(
        readFileSync(join(COMPONENTS, file), 'utf8'),
        pattern,
        `${file} declares \`id\` but does not key on it first`,
      )
    }
  })
})
