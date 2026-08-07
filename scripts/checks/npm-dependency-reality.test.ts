/**
 * `meta.dependencies` must describe reality, in both directions.
 *
 * ## What went wrong without it
 *
 * `avatar-group.meta.ts` and `user.meta.ts` both declared `@cascivo/components` — a package
 * that is `"private": true, "version": "0.0.0"` and can never be published. Neither component
 * imports it. The registry generator dutifully turned it into a `>=0.0.0` peer floor, and
 * `cascivo doctor --drift` reported it to an adopter as a requirement no install could satisfy.
 *
 * The same manifest was missing a dependency it really has: `avatar-group.tsx` imports
 * `@cascivo/i18n`, which was absent from the list. One hand-authored field, wrong in both
 * directions at once — Mechanism B. The fix is to derive it from the source.
 *
 * ## What this asserts
 *
 * 1. Every `@cascivo/*` in `meta.dependencies` is genuinely imported by that component's
 *    shipped source.
 * 2. Every bare `@cascivo/*` imported by shipped source is declared in `meta.dependencies`.
 * 3. No declared dependency resolves to a private workspace package.
 *
 * Relative imports are out of scope — `registryDependencies` covers those and
 * `scripts/registry/deps-check.ts` already verifies them.
 */
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import type { ComponentMeta } from '@cascivo/core'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SRC = join(ROOT, 'packages', 'components', 'src')

/** Strip comments so a `@deprecated` JSDoc showing `import … from '@cascivo/react'` is not read as a real import. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
}

/** Bare `@cascivo/*` specifiers, normalised to the package (`@cascivo/core/pure` → `@cascivo/core`). */
function cascivoImports(source: string): Set<string> {
  const found = new Set<string>()
  const re = /from\s+['"](@cascivo\/[^'"]+)['"]/g
  for (const m of stripComments(source).matchAll(re)) {
    const spec = m[1]!
    const pkg = /^(@cascivo\/[^/]+)/.exec(spec)?.[1]
    if (pkg) found.add(pkg)
  }
  return found
}

const isPrivate = async (pkg: string): Promise<boolean> => {
  const name = /^@cascivo\/(.+)$/.exec(pkg)?.[1]
  if (!name) return false
  const path = join(ROOT, 'packages', name, 'package.json')
  if (!existsSync(path)) return false
  const json = JSON.parse(await readFile(path, 'utf8')) as { private?: boolean }
  return json.private === true
}

interface Component {
  name: string
  meta: ComponentMeta
  imports: Set<string>
}

async function load(): Promise<Component[]> {
  const out: Component[] = []
  for (const entry of await readdir(SRC, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'test-utils' || entry.name === 'blocks') continue
    const dir = join(SRC, entry.name)
    const metaPath = join(dir, `${entry.name}.meta.ts`)
    if (!existsSync(metaPath)) continue
    const mod = (await import(pathToFileURL(metaPath).href)) as { meta: ComponentMeta }

    // Only the files `cascivo add` actually copies.
    const imports = new Set<string>()
    for (const file of await readdir(dir)) {
      if (!/\.tsx?$/.test(file)) continue
      if (/\.(test|stories|meta)\.tsx?$/.test(file) || file.endsWith('.d.ts')) continue
      for (const pkg of cascivoImports(await readFile(join(dir, file), 'utf8'))) imports.add(pkg)
    }
    out.push({ name: entry.name, meta: mod.meta, imports })
  }
  return out
}

const components = await load()

test('components load', () => {
  assert.ok(components.length > 100, `expected the full catalog, got ${components.length}`)
})

test('no manifest declares a dependency its source does not import', () => {
  const bad: string[] = []
  for (const c of components) {
    for (const dep of c.meta.dependencies ?? []) {
      if (!dep.startsWith('@cascivo/')) continue
      if (!c.imports.has(dep)) bad.push(`${c.name}: declares ${dep}, never imports it`)
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'))
})

test('no manifest omits a package its source imports', () => {
  const bad: string[] = []
  for (const c of components) {
    const declared = new Set(c.meta.dependencies ?? [])
    for (const pkg of c.imports) {
      if (!declared.has(pkg)) bad.push(`${c.name}: imports ${pkg}, does not declare it`)
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'))
})

test('no manifest depends on a private workspace package', async () => {
  const bad: string[] = []
  for (const c of components) {
    for (const dep of c.meta.dependencies ?? []) {
      if (await isPrivate(dep))
        bad.push(`${c.name}: depends on ${dep}, which is private and unpublishable`)
    }
  }
  assert.deepEqual(
    bad,
    [],
    `${bad.join('\n')}\nAn adopter cannot install a private package. This is what produced the ` +
      '">=0.0.0" peer floor `cascivo doctor --drift` reported as unsatisfiable.',
  )
})

test('no shipped artefact names an unpublishable package as an import specifier', async () => {
  const scan = [
    join(ROOT, 'packages', 'components', 'src'),
    join(ROOT, 'docs'),
    join(ROOT, 'apps', 'site', 'public', 'llms'),
  ]
  const offenders: string[] = []

  async function walk(dir: string): Promise<void> {
    if (!existsSync(dir)) return
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        // `docs/internal/**` is history, not guidance: adopter reports QUOTE the bad
        // specifier (that is the report), and dated planning docs record what was true
        // then. Rewriting either to satisfy a guard would destroy the record. Only
        // adopter-facing surfaces are in scope.
        if (full.endsWith(join('docs', 'internal'))) continue
        await walk(full)
        continue
      }
      if (!/\.(tsx?|md)$/.test(entry.name)) continue
      if (/\.(test|stories)\.tsx?$/.test(entry.name)) continue
      const text = await readFile(full, 'utf8')
      // Only contexts that tell a reader to IMPORT or INSTALL the package. A prose mention
      // or a source-tree link (`[\`@cascivo/layouts\`](../packages/layouts)`) is fine — the
      // package is real, it is just not a distribution. `vp run @cascivo/x#build` is a task
      // name, also fine.
      const patterns = [
        /from\s+['"](@cascivo\/[a-z-]+)(?:\/[^'"]*)?['"]/g,
        /import\s+['"](@cascivo\/[a-z-]+)(?:\/[^'"]*)?['"]/g,
        /(?:pnpm|npm|yarn|bun)\s+(?:add|install|i)\s+(?:-\S+\s+)*((?:@cascivo\/[a-z-]+\s*)+)/g,
      ]
      for (const re of patterns) {
        for (const m of text.matchAll(re)) {
          for (const pkg of m[1]!.trim().split(/\s+/)) {
            if (await isPrivate(pkg)) offenders.push(`${full.replace(`${ROOT}/`, '')}: ${pkg}`)
          }
        }
      }
    }
  }
  for (const dir of scan) await walk(dir)

  assert.deepEqual(
    [...new Set(offenders)],
    [],
    `${[...new Set(offenders)].join('\n')}\n` +
      'These name a private package as something to import. `@cascivo/components` is the ' +
      'registry source, not a distribution — an adopter following this gets "module not found".',
  )
})
