/**
 * TypeDefs-parity check — the nested-object-field analogue of props-parity.
 *
 * The per-component AI docs (llms/<name>.md, context/<name>.md) render a prop's
 * object shape ONLY from the manifest's hand-authored `typeDefs`. A prop typed as
 * a named object (`Column<Row>`, `ShellHeaderAction`, `SortState`) whose fields are
 * not in `typeDefs` ships with only the bare type name in every doc — so the field
 * an adopter actually needs (e.g. `Column.render` for custom cells) is invisible,
 * and props-parity does NOT catch it (that check stops at top-level props).
 *
 * This check resolves — via ts-morph — every OWN prop whose type is a repo-declared
 * named object with fields, and requires the manifest to declare a matching
 * `typeDefs` entry. Anonymous inline literals (`{ pageSize: number }`), ReactNode,
 * primitives, functions, and node_modules types are excluded by the resolver.
 *
 * Pre-existing gaps are ALLOWLISTED with a reason (the props-parity "warn-only
 * until swept" model), kept honest by the stale-entry test. New object-typed props
 * must ship `typeDefs` or fail here.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { resolveNamedObjectProps } from './lib/component-props.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

interface TypeDefMeta {
  name: string
  fields: { name: string }[]
}
interface RegistryComponent {
  name: string
  files?: string[]
  meta: { name: string; props?: { name: string }[]; typeDefs?: TypeDefMeta[] }
}

/**
 * Pre-existing object props not yet given `typeDefs`. Key: `<registry name>.<prop>`.
 * Value: why (usually "pre-existing sweep debt — document + remove"). Seeded from
 * the first run so the gate stays green while the mechanism is in place; new
 * components must not be added here. Kept honest by the stale-entry test.
 */
const SWEEP = 'pre-existing sweep debt — add typeDefs + `pnpm regen`, then remove this entry'
const ALLOWLIST: Record<string, string> = {
  'action-sheet.actions': SWEEP,
  'breadcrumb.items': SWEEP,
  'combobox.options': SWEEP,
  'command-menu.groups': SWEEP,
  'command-menu.scopes': SWEEP,
  'data-list.items': SWEEP,
  'date-range-picker.value': SWEEP,
  'date-range-picker.defaultValue': SWEEP,
  'date-range-picker.presets': SWEEP,
  'dock.items': SWEEP,
  'dropdown.items': SWEEP,
  'fab.actions': SWEEP,
  'file-uploader.files': SWEEP,
  'filter.options': SWEEP,
  'form.form': SWEEP,
  'header.links': SWEEP,
  'menu-button.items': SWEEP,
  'menubar.menus': SWEEP,
  'multi-select.options': SWEEP,
  'native-select.options': SWEEP,
  'navigation-menu.items': SWEEP,
  'overflow-menu.items': SWEEP,
  'progress-indicator.steps': SWEEP,
  'segmented-control.options': SWEEP,
  'select.options': SWEEP,
  'side-nav.items': SWEEP,
  'side-nav.groups': SWEEP,
  'steps.steps': SWEEP,
  'structured-list.items': SWEEP,
  'swipe-item.leadingActions': SWEEP,
  'swipe-item.trailingActions': SWEEP,
  'timeline.items': SWEEP,
  'toc.items': SWEEP,
  'toggle-group.items': SWEEP,
  'tree-view.items': SWEEP,
  'user.avatarProps': SWEEP,
  'layout/app-shell.state': SWEEP,
  'block/notification-center.notifications': SWEEP,
  'block/stats-cards.stats': SWEEP,
  'block/users-table-page.users': SWEEP,
  'section/feature-grid.items': SWEEP,
  'section/page-footer.groups': SWEEP,
  'section/stats-band.stats': SWEEP,
}

/** Base name of a typeDefs entry: `Column<Row>` → `Column`, `Foo[]` → `Foo`. */
function baseName(name: string): string {
  return name.replace(/[<[].*$/, '').trim()
}

function loadRegistry(): RegistryComponent[] {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: RegistryComponent[]
  }
  return registry.components
}

/** Repo-relative path from a registry file URL (`…/main/packages/x` → `packages/x`). */
function repoRelative(url: string): string {
  const i = url.indexOf('/packages/')
  return i === -1 ? url : url.slice(i + 1)
}

interface Checkable {
  name: string
  objectProps: Map<string, string>
  typeDefBaseNames: Set<string>
}

function collectCheckable(): Checkable[] {
  const out: Checkable[] = []
  for (const c of loadRegistry()) {
    const tsx = (c.files ?? []).filter((f) => f.endsWith('.tsx')).map(repoRelative)
    if (tsx.length === 0) continue // npm-installed (charts/flow/editor): no source
    const objectProps = resolveNamedObjectProps(tsx, `${c.meta.name}Props`)
    if (!objectProps || objectProps.size === 0) continue
    const typeDefBaseNames = new Set((c.meta.typeDefs ?? []).map((d) => baseName(d.name)))
    out.push({ name: c.name, objectProps, typeDefBaseNames })
  }
  return out
}

describe('typedefs-parity — object-typed props declare their field shapes', () => {
  const checkable = collectCheckable()

  it('every named-object prop has a matching typeDefs entry', () => {
    const errors: string[] = []
    for (const c of checkable) {
      for (const [prop, typeName] of c.objectProps) {
        if (c.typeDefBaseNames.has(typeName)) continue
        if (ALLOWLIST[`${c.name}.${prop}`] !== undefined) continue
        errors.push(
          `  ${c.name}: prop '${prop}' is typed '${typeName}' (a named object) but has no ` +
            `typeDefs entry for '${typeName}'`,
        )
      }
    }
    assert.deepEqual(
      errors,
      [],
      `These object-typed props have no typeDefs, so their fields appear in no AI doc ` +
        `(add a typeDefs entry to the .meta.ts + \`pnpm regen\`, or allowlist with a reason):\n${errors.join('\n')}`,
    )
  })

  it('allowlist has no stale entries', () => {
    const byName = new Map(checkable.map((c) => [c.name, c]))
    const stale: string[] = []
    for (const [key, reason] of Object.entries(ALLOWLIST)) {
      const dot = key.lastIndexOf('.')
      const compName = key.slice(0, dot)
      const prop = key.slice(dot + 1)
      const c = byName.get(compName)
      const typeName = c?.objectProps.get(prop)
      // Stale if the prop is no longer a named object, or now has its typeDefs.
      if (!c || !typeName || c.typeDefBaseNames.has(typeName)) stale.push(`${key} (${reason})`)
    }
    assert.deepEqual(stale, [], `Stale ALLOWLIST entries — remove them:\n  ${stale.join('\n  ')}`)
  })
})
