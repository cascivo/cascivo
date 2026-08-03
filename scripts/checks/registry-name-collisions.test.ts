/**
 * Registry display-name collision guard.
 *
 * `export-collisions.test.ts` already guards collisions **across packages** (`Text` in
 * `@cascivo/react` vs the SVG primitive in `@cascivo/charts`). It is structurally unable to
 * see two entries that collide **inside one registry collection**, which is where the
 * damage actually happened:
 *
 * - `app-shell` and `layout/app-shell` are both `AppShell`, with incompatible APIs
 *   (`nav` vs `sideNav`, and only one has `aside`/`persistKey`/`sideNavMode`).
 * - `calendar` and `chart/calendar` are both `Calendar` — a date picker and a heatmap.
 *
 * Only one of each pair is exported from `@cascivo/react`, but `packageFor` resolved the
 * distribution channel by **display name**, so both twins were labelled npm-distributed and
 * the copy-paste twin's generated page carried
 * `import { AppShell } from '@cascivo/react'`. Following that line silently hands the reader
 * the other component. An adopter called this "the single most likely thing to make a new
 * adopter conclude the library is broken".
 *
 * Two assertions, and the second is the real one:
 *
 * 1. No NEW same-name pair without a recorded reason (the `KNOWN` pattern, matching
 *    `export-collisions.test.ts`).
 * 2. **No generated page advertises a bare `@cascivo/react` import for a symbol that
 *    package does not export.** That is the generalisation of `path-b-parity.test.ts` from
 *    primitives to components, and it holds whether or not a name collides — so it keeps
 *    working after the renames that retire the pairs below.
 *
 * Run: `pnpm meta:check`.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { reactExportedModules, reactExportedNames } from '../registry/react-exports.ts'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const LLMS_DIR = join(REPO_ROOT, 'apps/site/public/llms')

/**
 * Same-name pairs that are tolerated for now, with why. Renaming is a breaking change
 * (tracked in the adopter-experience plan, WS-B1/WS-F0); shipping a *third* pair is not.
 * A stale entry — a name that no longer collides — must be removed, which the second test
 * enforces so this map cannot rot into a permanent excuse.
 */
const KNOWN: Record<string, string> = {}

interface Entry {
  files?: string[]
  name: string
  meta?: { name?: string }
}

function loadCollections(): Record<string, Entry[]> {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as Record<
    string,
    unknown
  >
  const out: Record<string, Entry[]> = {}
  for (const key of ['components', 'blocks', 'templates']) {
    if (Array.isArray(registry[key])) out[key] = registry[key] as Entry[]
  }
  return out
}

/** Display name → the entry names sharing it, across every collection. */
function collisions(): Map<string, string[]> {
  const byName = new Map<string, string[]>()
  for (const entries of Object.values(loadCollections())) {
    for (const e of entries) {
      const display = e.meta?.name ?? e.name
      byName.set(display, [...(byName.get(display) ?? []), e.name])
    }
  }
  return new Map([...byName].filter(([, ids]) => ids.length > 1))
}

/**
 * Fenced code blocks only. Prose must be excluded: the collision banner *quotes* the bare
 * import in order to warn against it ("`import { AppShell } …` does NOT give you this
 * page's component"), and scanning prose would read that warning as the instruction.
 */
function codeOf(src: string): string {
  return [...src.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]!).join('\n')
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const item of readdirSync(dir)) {
    const full = join(dir, item)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (item.endsWith('.md')) out.push(full)
  }
  return out
}

describe('registry-name-collisions', () => {
  it('records every same-name pair, and nothing new', () => {
    const found = collisions()
    const undocumented = [...found].filter(([name]) => KNOWN[name] === undefined)
    assert.deepEqual(
      undocumented.map(([name, ids]) => `${name}: ${ids.join(', ')}`),
      [],
      'A NEW pair of registry entries shares a display name. Two exported symbols with one\n' +
        'name and different prop surfaces is a trap no amount of documentation fixes — the\n' +
        'adopter reads one page and imports the other component. Rename one, or add it to\n' +
        'KNOWN with the reason it must stay.',
    )
  })

  it('has no stale KNOWN entries', () => {
    const found = collisions()
    const stale = Object.keys(KNOWN).filter((name) => !found.has(name))
    assert.deepEqual(
      stale,
      [],
      `KNOWN names that no longer collide: ${stale.join(', ')}. Remove them so the map stays\n` +
        'an accurate record rather than a permanent excuse.',
    )
  })

  it('no generated page advertises an @cascivo/react import that does not exist', () => {
    const exported = reactExportedNames(REPO_ROOT)
    const offenders: string[] = []

    for (const file of walk(LLMS_DIR)) {
      const src = codeOf(readFileSync(file, 'utf8'))
      for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*'@cascivo\/react'/g)) {
        for (const raw of m[1]!.split(',')) {
          const symbol = raw.trim().replace(/^type\s+/, '')
          if (symbol === '' || exported.has(symbol)) continue
          offenders.push(`${relative(REPO_ROOT, file)} imports { ${symbol} }`)
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      'A generated page tells adopters to import a symbol @cascivo/react does not export:\n' +
        `${offenders.join('\n')}\n` +
        'Fix packageFor in scripts/llms/generate.ts — distribution channel must be resolved\n' +
        "by the entry's own source module, never by its display name.",
    )
  })

  it("a page's bare @cascivo/react import resolves to the entry that page documents", () => {
    // The name-existence check above is NOT enough, and that gap is the whole bug:
    // `AppShell` *is* a real @cascivo/react export, so /llms/layout/app-shell.md's
    // `import { AppShell } from '@cascivo/react'` looked valid to any name-keyed check
    // while handing the reader a component with a different prop surface.
    const modules = reactExportedModules(REPO_ROOT)
    const byEntryName = new Map<string, Entry>()
    for (const entries of Object.values(loadCollections())) {
      for (const e of entries) byEntryName.set(e.name, e)
    }

    const offenders: string[] = []
    for (const file of walk(LLMS_DIR)) {
      // apps/site/public/llms/layout/app-shell.md → entry `layout/app-shell`
      const entryName = relative(LLMS_DIR, file).replace(/\.md$/, '')
      const entry = byEntryName.get(entryName)
      if (!entry) continue
      const display = entry.meta?.name ?? entry.name
      const advertises = new RegExp(
        `import\\s*\\{[^}]*\\b${display}\\b[^}]*\\}\\s*from\\s*'@cascivo/react'`,
      ).test(codeOf(readFileSync(file, 'utf8')))
      if (!advertises) continue

      const ownModules = (entry.files ?? [])
        .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
        .map((f) => {
          const i = f.indexOf('/packages/')
          return i === -1 ? f : f.slice(i + 1)
        })
      if (!ownModules.some((p) => modules.has(p))) {
        offenders.push(
          `${relative(REPO_ROOT, file)} says \`import { ${display} } from '@cascivo/react'\`, ` +
            `but that resolves to a different entry — ${entry.name}'s own module is not re-exported.`,
        )
      }
    }

    assert.deepEqual(
      offenders,
      [],
      'A generated page advertises a bare @cascivo/react import that silently resolves to a\n' +
        'DIFFERENT component sharing the display name:\n' +
        `${offenders.join('\n')}`,
    )
  })
})
