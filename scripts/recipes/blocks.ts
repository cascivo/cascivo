/**
 * Turns registry page blocks into scaffold recipes a blueprint page can use.
 *
 * A block's source is written for the copy-paste path: it imports its components by relative
 * path (`../../badge/badge`) and its hooks from `@cascivo/core`. An app from `cascivo create`
 * has neither — it depends on `@cascivo/react` alone. So each block is rewritten to import every
 * name from `@cascivo/react` and written to `packages/cli/recipes/block-<name>/src/blocks/`.
 *
 * Imports from `@cascivo/charts` and `@cascivo/icons` stay as written and become the recipe's
 * `dependencies`, which the scaffold adds to package.json. A block is skipped, with the reason
 * printed, when the rewrite cannot be correct: a name `@cascivo/react` does not export, an
 * import from any other package, or a block that is a whole app shell rather than a page.
 *
 * Chained into `pnpm regen`; the drift gate catches staleness.
 *
 * Run with: `pnpm recipes:blocks`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { reactExportedNames } from '../registry/react-exports.ts'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SOURCES = [
  join(REPO_ROOT, 'packages/components/src/blocks'),
  join(REPO_ROOT, 'packages/layouts/src/blocks'),
]
const RECIPES = join(REPO_ROOT, 'packages/cli/recipes')
const MCP_CATALOG = join(REPO_ROOT, 'packages/mcp/src/blocks.generated.ts')

/** Blocks that are an app's whole frame. A blueprint page renders inside the scaffold's shell. */
const SHELLS = new Set(['app-shell', 'console-app', 'sidebar-app'])

export function pascalCase(name: string): string {
  return name.replace(/(^|-)([a-z0-9])/g, (_, _dash: string, c: string) => c.toUpperCase())
}

/** Packages a block may bring into the app besides @cascivo/react; the scaffold adds them. */
const BRINGABLE = new Set(['@cascivo/charts', '@cascivo/icons'])

type Rewrite = { ok: true; source: string; dependencies: string[] } | { ok: false; reason: string }

/**
 * Rewrite a block's imports for an app that depends on `@cascivo/react` only. `cssFile` is the
 * block's own stylesheet, which travels with it.
 */
export function rewriteBlock(source: string, exported: Set<string>, cssFile: string): Rewrite {
  const values = new Set<string>()
  const types = new Set<string>()
  const kept: string[] = []
  const dependencies = new Set<string>()
  const importRe = /^import\s+(type\s+)?([\s\S]*?)\s+from\s+'([^']+)'\n/gm
  let firstImport = -1
  for (const match of source.matchAll(importRe)) {
    const [statement, typeOnly, clause, specifier] = match as unknown as [
      string,
      string | undefined,
      string,
      string,
    ]
    if (firstImport === -1) firstImport = match.index
    const fromReact =
      specifier === '@cascivo/core' ||
      specifier === '@cascivo/react' ||
      (specifier.startsWith('.') && !specifier.endsWith('.css'))
    if (!fromReact) {
      if (specifier === 'react' || specifier === `./${cssFile}` || BRINGABLE.has(specifier)) {
        if (BRINGABLE.has(specifier)) dependencies.add(specifier)
        kept.push(statement)
        continue
      }
      return { ok: false, reason: `imports ${specifier}, which the scaffold does not depend on` }
    }
    const braces = /^\{([\s\S]*)\}$/.exec(clause.trim())
    if (!braces) return { ok: false, reason: `has a non-named import from ${specifier}` }
    for (const part of braces[1]!.split(',').map((p) => p.trim())) {
      if (!part) continue
      const isType = typeOnly !== undefined || part.startsWith('type ')
      const name = part.replace(/^type\s+/, '')
      if (!exported.has(name))
        return { ok: false, reason: `@cascivo/react does not export ${name}` }
      ;(isType ? types : values).add(name)
    }
  }
  for (const name of values) types.delete(name)
  const sorted = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b)).join(', ')
  const imports = [
    ...(values.size > 0 ? [`import { ${sorted(values)} } from '@cascivo/react'\n`] : []),
    ...(types.size > 0 ? [`import type { ${sorted(types)} } from '@cascivo/react'\n`] : []),
    ...kept,
  ].join('')
  const body = source.replace(importRe, '')
  return {
    ok: true,
    source: body.slice(0, firstImport) + imports + body.slice(firstImport),
    dependencies: [...dependencies].sort(),
  }
}

function main(): void {
  const exported = reactExportedNames(REPO_ROOT)
  for (const dir of readdirSync(RECIPES)) {
    if (dir.startsWith('block-')) rmSync(join(RECIPES, dir), { recursive: true })
  }
  const written: string[] = []
  for (const root of SOURCES) {
    for (const name of readdirSync(root).sort()) {
      const tsxPath = join(root, name, `${name}.tsx`)
      if (!existsSync(tsxPath)) continue
      if (SHELLS.has(name)) {
        console.log(`recipes:blocks: skipping ${name} — an app shell, not a page`)
        continue
      }
      const source = readFileSync(tsxPath, 'utf8')
      if (!new RegExp(`^export function ${pascalCase(name)}\\b`, 'm').test(source)) {
        throw new Error(`${tsxPath} must export function ${pascalCase(name)}`)
      }
      const cssFile = `${name}.module.css`
      const rewrite = rewriteBlock(source, exported, cssFile)
      if (!rewrite.ok) {
        console.log(`recipes:blocks: skipping ${name} — ${rewrite.reason}`)
        continue
      }
      const out = join(RECIPES, `block-${name}`)
      const files = [`src/blocks/${name}.tsx`]
      mkdirSync(join(out, 'src/blocks'), { recursive: true })
      writeFileSync(join(out, files[0]!), rewrite.source)
      const cssPath = join(root, name, cssFile)
      if (existsSync(cssPath)) {
        files.push(`src/blocks/${cssFile}`)
        writeFileSync(join(out, files[1]!), readFileSync(cssPath, 'utf8'))
      }
      writeFileSync(
        join(out, 'recipe.json'),
        `${JSON.stringify(
          {
            name: `block-${name}`,
            files,
            ...(rewrite.dependencies.length > 0 ? { dependencies: rewrite.dependencies } : {}),
          },
          null,
          2,
        )}\n`,
      )
      written.push(name)
    }
  }
  writeCatalog(written)
  console.log(`recipes:blocks: wrote ${written.length} block recipes: ${written.join(', ')}`)
}

/**
 * The MCP server offers the same blocks to an agent writing a blueprint (`list_blocks`,
 * `compose_app`), with the registry's one-line description of each. Generated here so the
 * two lists cannot disagree.
 */
function writeCatalog(blocks: string[]): void {
  const registry = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf8')) as {
    components: { name: string; description: string }[]
    blocks: { name: string; description: string }[]
  }
  const entries = [...registry.components, ...registry.blocks]
  const rows = blocks.map((name) => {
    const entry = entries.find((e) => e.name === name || e.name === `block/${name}`)
    if (!entry) throw new Error(`recipes:blocks: ${name} is not in registry.json`)
    return `  [${JSON.stringify(name)}, ${JSON.stringify(entry.description)}],`
  })
  writeFileSync(
    MCP_CATALOG,
    `// Generated by scripts/recipes/blocks.ts — run \`pnpm recipes:blocks\`. Do not edit.\n\n` +
      `/** The registry blocks a blueprint page can render (\`cascivo create --from\`), with what each shows. */\n` +
      `export const BLUEPRINT_BLOCKS: ReadonlyMap<string, string> = new Map([\n${rows.join('\n')}\n])\n`,
  )
  // As the registry generator does: format, so the committed file is what the formatter leaves.
  const vp = join(REPO_ROOT, 'node_modules', '.bin', 'vp')
  if (existsSync(vp)) spawnSync(vp, ['fmt', MCP_CATALOG], { cwd: REPO_ROOT, stdio: 'ignore' })
}

if (import.meta.url === `file://${process.argv[1]}`) main()
