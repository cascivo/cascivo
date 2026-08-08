/**
 * Generates `registry.json` from component/layout/block manifests.
 *
 * Scans multiple source roots and produces a flat `components` array tagged
 * with a `type` field so consumers can filter by category of entry.
 *
 * Run with: `pnpm registry:generate` (or `vp run registry:generate`).
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ComponentMeta } from '@cascivo/core'
import {
  buildRegistry,
  parseLegacyRegistry,
  writeShadcnRegistry,
} from '../../packages/registry/src/index.ts'
import type { BlockMeta } from '../../packages/components/src/blocks/types.ts'
import { stampForVersion } from './generated-at.ts'
import { exportedNamesOf, reactExportedNames } from './react-exports.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const reactExports = reactExportedNames(REPO_ROOT)
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

const BASE_URL = (
  process.env.REGISTRY_BASE_URL ?? 'https://raw.githubusercontent.com/cascivo/cascivo/main'
).replace(/\/+$/, '')

type EntryType = 'component' | 'layout' | 'block' | 'chart' | 'section' | 'flow' | 'editor'

interface SourceRoot {
  dir: string
  type: EntryType
  /** Prepended to component name in registry (e.g. "layout/"). */
  prefix: string
  /** Subdirectories to skip when scanning this root. */
  skipDirs?: string[]
}

const ROOTS: SourceRoot[] = [
  {
    dir: join(REPO_ROOT, 'packages', 'components', 'src'),
    type: 'component',
    prefix: '',
  },
  {
    dir: join(REPO_ROOT, 'packages', 'layouts', 'src'),
    type: 'layout',
    prefix: 'layout/',
    skipDirs: ['blocks', 'sections'],
  },
  {
    dir: join(REPO_ROOT, 'packages', 'layouts', 'src', 'blocks'),
    type: 'block',
    prefix: 'block/',
  },
  {
    dir: join(REPO_ROOT, 'packages', 'charts', 'src', 'charts'),
    type: 'chart',
    prefix: 'chart/',
  },
  {
    dir: join(REPO_ROOT, 'packages', 'editor', 'src', 'editor'),
    type: 'editor',
    prefix: 'editor/',
  },
  {
    dir: join(REPO_ROOT, 'packages', 'layouts', 'src', 'sections'),
    type: 'section',
    prefix: 'section/',
  },
  {
    dir: join(REPO_ROOT, 'packages', 'flow', 'src', 'flows'),
    type: 'flow',
    prefix: 'flow/',
  },
  {
    // FlowCanvas is public @cascivo/flow API (exported from the package root);
    // it lives under core/ rather than flows/ but must still be discoverable.
    dir: join(REPO_ROOT, 'packages', 'flow', 'src', 'core'),
    type: 'flow',
    prefix: 'flow/',
  },
]

interface RegistryComponent {
  name: string
  type: EntryType
  description: string
  category: string
  version: string
  files: string[]
  /** filename → sha256 of the source content — `cascivo update --check` diffs these against the lockfile. */
  fileHashes?: Record<string, string>
  /** npm package to install instead of copying files (used for type: 'chart'). */
  install?: string
  /**
   * Every way to obtain this entry: `npm:@cascivo/react`, `npm:@cascivo/charts`, `copy`.
   * Derived from the real export list — the single source of truth for "is it importable".
   */
  channels?: string[]
  /**
   * Symbols of this entry that `@cascivo/react` exports, when the entry's own display name
   * is not one of them (`toast` → `ToastProvider`, `useToast`, `dismissAllToasts`). Lets a
   * partially-exported entry be described precisely instead of rounded to "npm" or "copy".
   */
  importableSymbols?: string[]
  /**
   * Stylesheet import specifier this entry's npm package requires, e.g.
   * `@cascivo/charts/styles.css` — present only when `install` is set and that
   * package exports a `./styles.css`. Emitted so every generated surface (llms
   * docs, CLI `add`) can remind consumers to import it; without it a chart's
   * screen-reader data-table fallback renders visibly.
   */
  styles?: string
  /**
   * Present when the component is deprecated. Hoisted out of `meta` so every consumer of the
   * registry (`cascivo list`/`search`/`add`, the MCP tools, the docs site) can render the
   * marker without loading the full manifest — the point of the field is that an adopter sees
   * it BEFORE installing, and a surface that has to dig for it will not show it.
   */
  deprecated?: ComponentMeta['deprecated']
  dependencies: string[]
  /**
   * Minimum published version of each `@cascivo/*` npm dependency this entry's
   * copied source requires, e.g. `{ "@cascivo/i18n": ">=0.2.1" }` — derived
   * from the current workspace package version at generation time. Lets the
   * CLI (`add`, `doctor --drift`) detect installs where the copied registry
   * source is ahead of the npm-installed peer package (the DataTable/i18n
   * dashboard-feedback failure: a component references a builtin catalog key
   * a not-yet-published i18n version lacks).
   */
  peerVersions?: Record<string, string>
  /** Other registry components this entry needs (shared hooks/utils, siblings). */
  registryDependencies?: string[]
  tags: string[]
  /** Full component manifest — consumed by the MCP server and docs. */
  meta: ComponentMeta
}

/**
 * Files that make up a copy-paste component, in a stable display order.
 * Includes `.tsx`, shared `.ts` source (hooks/utils a component imports, e.g.
 * `use-popover.ts`), and `.module.css`. Excludes tests, manifests, stories, and
 * ambient declarations.
 */
function isSourceFile(file: string): boolean {
  if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) return false
  if (file.endsWith('.meta.ts') || file.endsWith('.d.ts')) return false
  if (file.endsWith('.stories.tsx') || file.endsWith('.stories.ts')) return false
  return file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.module.css')
}

function sortFiles(a: string, b: string): number {
  // .tsx (main) first, then shared .ts, then .module.css.
  const rank = (f: string) => (f.endsWith('.tsx') ? 0 : f.endsWith('.module.css') ? 2 : 1)
  return rank(a) - rank(b) || a.localeCompare(b)
}

function sha256(content: string): string {
  return `sha256-${createHash('sha256').update(content).digest('hex')}`
}

/**
 * Registry entries carry the @cascivo/react version: the components package
 * itself is private and pinned at 0.0.0, while @cascivo/react is the published
 * distribution of the same sources and is bumped by changesets whenever they
 * change — so it is the meaningful "library version" for installed copies.
 */
async function readComponentVersion(): Promise<string> {
  const pkg = JSON.parse(
    await readFile(join(REPO_ROOT, 'packages', 'react', 'package.json'), 'utf8'),
  ) as { version: string }
  return pkg.version
}

const stylesheetCache = new Map<string, string | null>()

/**
 * Resolves the stylesheet import specifier for an npm-distributed package, by
 * reading its `package.json` `exports` map for a `./styles.css` entry. Returns
 * e.g. `@cascivo/charts/styles.css`, or null if the package ships no stylesheet.
 * Driving this off the export map (rather than a hand-maintained per-type list)
 * means any future npm package that adds a stylesheet is surfaced automatically.
 */
async function resolveStylesheet(installPkg: string): Promise<string | null> {
  if (stylesheetCache.has(installPkg)) return stylesheetCache.get(installPkg) ?? null
  const m = /^@cascivo\/(.+)$/.exec(installPkg)
  let result: string | null = null
  if (m) {
    try {
      const pkg = JSON.parse(
        await readFile(join(REPO_ROOT, 'packages', m[1], 'package.json'), 'utf8'),
      ) as { exports?: Record<string, unknown> }
      if (pkg.exports?.['./styles.css']) result = `${installPkg}/styles.css`
    } catch {
      result = null
    }
  }
  stylesheetCache.set(installPkg, result)
  return result
}

const workspaceVersionCache = new Map<string, string | null>()

/**
 * Resolves a `@cascivo/<pkg>` dependency to its current workspace version, or null if not a
 * workspace package.
 *
 * Throws when the package is private or version-less. A private workspace package can never
 * be a legal `meta.dependencies` entry — an adopter cannot install it — so being asked to
 * floor one means a manifest is wrong, and the generator should say so rather than emit a
 * number. `packages/components` is `"private": true, "version": "0.0.0"`, and two manifests
 * listed it: the floor came out as `>=0.0.0`, a constraint that constrains nothing, printed
 * by `cascivo doctor --drift` as a requirement no install could ever satisfy.
 */
async function resolveWorkspaceVersion(dep: string): Promise<string | null> {
  if (workspaceVersionCache.has(dep)) return workspaceVersionCache.get(dep) ?? null
  const m = /^@cascivo\/(.+)$/.exec(dep)
  if (!m) {
    workspaceVersionCache.set(dep, null)
    return null
  }
  let pkg: { version?: string; private?: boolean }
  try {
    pkg = JSON.parse(
      await readFile(join(REPO_ROOT, 'packages', m[1]!, 'package.json'), 'utf8'),
    ) as {
      version?: string
      private?: boolean
    }
  } catch {
    // Not a workspace package at all (e.g. a future external scope) — no floor to emit.
    workspaceVersionCache.set(dep, null)
    return null
  }
  if (pkg.private === true) {
    throw new Error(
      `registry: "${dep}" is a PRIVATE workspace package and cannot be a component dependency — ` +
        'no adopter can install it. Remove it from the manifest that lists it ' +
        '(`pnpm meta:check` names which one).',
    )
  }
  if (typeof pkg.version !== 'string' || pkg.version === '0.0.0') {
    throw new Error(
      `registry: "${dep}" has no publishable version (${pkg.version ?? 'undefined'}), so its ` +
        'peer floor would constrain nothing. Fix the package version or the manifest.',
    )
  }
  workspaceVersionCache.set(dep, pkg.version)
  return pkg.version
}

/** Builds the `>=x.y.z` peer-version floor map for a component's `@cascivo/*` dependencies. */
async function resolvePeerVersions(
  dependencies: string[],
): Promise<Record<string, string> | undefined> {
  const floors: Record<string, string> = {}
  for (const dep of dependencies) {
    const version = await resolveWorkspaceVersion(dep)
    if (version) floors[dep] = `>=${version}`
  }
  return Object.keys(floors).length > 0 ? floors : undefined
}

async function buildEntry(
  root: SourceRoot,
  localName: string,
  version: string,
): Promise<RegistryComponent> {
  const dir = join(root.dir, localName)
  const metaPath = join(dir, `${localName}.meta.ts`)
  const mod = (await import(pathToFileURL(metaPath).href)) as { meta: ComponentMeta }
  const meta = mod.meta

  // Compute the relative path from repo root so URLs are accurate.
  const relDir = dir.slice(REPO_ROOT.length + 1).replace(/\\/g, '/')

  // Charts, flow primitives, and the editor are npm-installed (not copy-pasted): empty files.
  const isNpmInstalled = root.type === 'chart' || root.type === 'flow' || root.type === 'editor'

  const fileNames = isNpmInstalled ? [] : (await readdir(dir)).filter(isSourceFile).sort(sortFiles)
  const files = fileNames.map((file) => `${BASE_URL}/${relDir}/${file}`)
  const fileHashes: Record<string, string> = {}
  for (const file of fileNames) {
    fileHashes[file] = sha256(await readFile(join(dir, file), 'utf8'))
  }

  const peerVersions = await resolvePeerVersions(meta.dependencies)
  const entry: RegistryComponent = {
    name: `${root.prefix}${localName}`,
    type: root.type,
    description: meta.description,
    category: meta.category,
    version,
    files,
    ...(fileNames.length > 0 ? { fileHashes } : {}),
    dependencies: meta.dependencies,
    ...(peerVersions ? { peerVersions } : {}),
    ...(meta.deprecated ? { deprecated: meta.deprecated } : {}),
    tags: meta.tags,
    meta,
  }
  if (meta.registryDependencies?.length) {
    entry.registryDependencies = meta.registryDependencies
  }
  if (root.type === 'chart') {
    entry.install = '@cascivo/charts'
  } else if (root.type === 'flow') {
    entry.install = '@cascivo/flow'
  } else if (root.type === 'editor') {
    entry.install = '@cascivo/editor'
  }
  if (entry.install) {
    const styles = await resolveStylesheet(entry.install)
    if (styles) entry.styles = styles
  }
  // How you can actually get this entry — derived from the real `@cascivo/react` export
  // list, never from the source path. Consumers (CLI, MCP, docs generators, the site) read
  // this instead of each re-deriving it, which is how the layout primitives ended up
  // documented as "copy-paste only" while being importable. See scripts/registry/react-exports.ts.
  //
  // Resolved by SYMBOL, not by display name. `toast`'s display name is `Toast`, which
  // `@cascivo/react` does not export — but `ToastProvider`, `useToast` and
  // `dismissAllToasts` are exported and are the whole usable API, so labelling the entry
  // "copy-paste only" was wrong in the way that matters. `importableSymbols` records
  // exactly which of the entry's symbols an adopter can `import`, so a partially-exported
  // entry can say so instead of rounding to one of two wrong answers.
  const entrySymbols = new Set<string>()
  for (const file of fileNames) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue
    if (file.endsWith('.meta.ts') || file.includes('.test.')) continue
    for (const name of exportedNamesOf(join(dir, file))) entrySymbols.add(name)
  }
  const importable = [...entrySymbols].filter((n) => reactExports.has(n)).sort()
  entry.channels = [
    ...(entry.install
      ? [`npm:${entry.install}`]
      : reactExports.has(meta.name) || importable.length > 0
        ? ['npm:@cascivo/react']
        : []),
    ...(fileNames.length > 0 ? ['copy'] : []),
  ]
  // Only interesting when the entry's own display name is NOT importable — that is the
  // partial case a single channel label cannot express.
  if (!entry.install && !reactExports.has(meta.name) && importable.length > 0) {
    entry.importableSymbols = importable
  }
  return entry
}

interface BlockRegistryEntry {
  name: string
  type: 'block'
  displayName: string
  description: string
  category: string
  version: string
  files: string[]
  dependencies: string[]
  tags: string[]
  screenshot: { light: string; dark: string }
  /** When-to-use guidance for agents — mirrors component metas. */
  intent?: BlockMeta['intent']
}

const BLOCKS_DIR = join(REPO_ROOT, 'packages', 'components', 'src', 'blocks')

async function scanBlocks(version: string): Promise<BlockRegistryEntry[]> {
  if (!existsSync(BLOCKS_DIR)) return []

  const dirents = await readdir(BLOCKS_DIR, { withFileTypes: true })
  const names = dirents
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  const entries: BlockRegistryEntry[] = []
  for (const name of names) {
    const metaPath = join(BLOCKS_DIR, name, `${name}.meta.ts`)
    if (!existsSync(metaPath)) {
      console.warn(`  skip block/${name}: no ${name}.meta.ts found`)
      continue
    }
    const mod = (await import(pathToFileURL(metaPath).href)) as { meta: BlockMeta }
    const meta = mod.meta
    const relDir = `packages/components/src/blocks/${name}`
    const files = (await readdir(join(BLOCKS_DIR, name)))
      .filter(isSourceFile)
      .sort(sortFiles)
      .map((file) => `${BASE_URL}/${relDir}/${file}`)

    entries.push({
      name: meta.name,
      type: 'block',
      displayName: meta.displayName,
      description: meta.description,
      category: meta.category,
      version,
      files,
      dependencies: ['@cascivo/react'],
      tags: meta.tags,
      screenshot: meta.screenshot,
      ...(meta.intent ? { intent: meta.intent } : {}),
    })
  }
  return entries
}

async function scanRoot(root: SourceRoot, version: string): Promise<RegistryComponent[]> {
  if (!existsSync(root.dir)) return []

  const dirents = await readdir(root.dir, { withFileTypes: true })
  const names = dirents
    .filter((d) => d.isDirectory() && !(root.skipDirs ?? []).includes(d.name))
    .map((d) => d.name)
    .sort()

  const entries: RegistryComponent[] = []
  for (const name of names) {
    const metaPath = join(root.dir, name, `${name}.meta.ts`)
    if (!existsSync(metaPath)) {
      console.warn(`  skip ${root.prefix}${name}: no ${name}.meta.ts found`)
      continue
    }
    entries.push(await buildEntry(root, name, version))
  }
  return entries
}

/** Run the repo formatter over registry.json so committed output is stable. */
function formatRegistry(target: string = REGISTRY_PATH): void {
  const vp = join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vp.cmd' : 'vp')
  if (!existsSync(vp)) return
  spawnSync(vp, ['fmt', target], { cwd: REPO_ROOT, stdio: 'ignore' })
}

/** Hosts a registry file URL may point at. Anything else is a generation bug. */
const ALLOWED_URL_HOSTS =
  /^https:\/\/(raw\.githubusercontent\.com\/cascivo\/cascivo|cascivo\.com)\//

interface TemplateItem {
  name: string
  type: string
  files: { url: string; target?: string }[]
  [key: string]: unknown
}

/** First-party templates, folded in from templates/cascivo-registry.json so the CLI can resolve them by bare name. */
async function readTemplates(): Promise<TemplateItem[]> {
  const manifestPath = join(REPO_ROOT, 'templates', 'cascivo-registry.json')
  if (!existsSync(manifestPath)) return []
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { items: TemplateItem[] }
  return manifest.items.filter((item) => item.type === 'template')
}

function assertAllowedHosts(urls: string[]): void {
  const bad = urls.filter((u) => !ALLOWED_URL_HOSTS.test(u) && !u.startsWith(BASE_URL))
  if (bad.length > 0) {
    throw new Error(`Registry file URLs on non-allowlisted hosts:\n  ${bad.join('\n  ')}`)
  }
}

async function main(): Promise<void> {
  const version = await readComponentVersion()

  const components: RegistryComponent[] = []
  for (const root of ROOTS) {
    const entries = await scanRoot(root, version)
    components.push(...entries)
  }

  const blocks = await scanBlocks(version)
  const templates = await readTemplates()

  assertAllowedHosts([
    ...components.flatMap((c) => c.files),
    ...blocks.flatMap((b) => b.files),
    ...templates.flatMap((t) => t.files.map((f) => f.url)),
  ])

  const registry = {
    version,
    generatedAt: stampForVersion(version),
    components,
    blocks,
    templates,
  }

  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  formatRegistry()
  console.log(
    `Wrote ${components.length} component entries, ${blocks.length} block entries, and ${templates.length} template entries to registry.json (base: ${BASE_URL})`,
  )

  // Emit per-item static files under apps/site/public/r/
  const docsPublicR = join(REPO_ROOT, 'apps', 'site', 'public', 'r')
  const index = parseLegacyRegistry(registry)
  await buildRegistry(index, docsPublicR)

  // Templates resolve through the same per-item path (cascivo.com/r/<name>.json),
  // so `cascivo add dashboard` / `create --template dashboard` work against the
  // default registry.
  for (const t of templates) {
    await writeFile(join(docsPublicR, `${t.name}.json`), `${JSON.stringify(t, null, 2)}\n`, 'utf8')
  }
  // buildRegistry emits JSON.stringify(_, 2) with expanded arrays; oxfmt collapses
  // short arrays. Format here so committed per-item files match the formatter and
  // raw `pnpm regen` output stays drift-free without a separate `vp check --fix`.
  formatRegistry(docsPublicR)

  // Additive shadcn-registry interop: emit r/shadcn/<name>.json with inlined
  // source so `npx shadcn add <host>/r/shadcn/<name>.json` works. cascivo's own
  // registry schema (above) is untouched.
  const contentByUrl = new Map<string, string>()
  for (const it of index.items) {
    for (const f of it.files) {
      if (!f.url.startsWith(BASE_URL) || contentByUrl.has(f.url)) continue
      try {
        contentByUrl.set(
          f.url,
          await readFile(join(REPO_ROOT, f.url.slice(BASE_URL.length + 1)), 'utf8'),
        )
      } catch {
        // Source not readable locally (e.g. npm-only charts) — emit without content.
      }
    }
  }
  const shadcnDir = join(docsPublicR, 'shadcn')
  await writeShadcnRegistry(index, shadcnDir, { resolveContent: (url) => contentByUrl.get(url) })
  formatRegistry(shadcnDir)
  console.log(`Wrote shadcn-compatible registry to ${shadcnDir}`)

  // Copy JSON Schemas to docs public
  const schemaDir = join(REPO_ROOT, 'apps', 'site', 'public', 'schema')
  const { mkdir, copyFile } = await import('node:fs/promises')
  await mkdir(schemaDir, { recursive: true })
  const schemaFiles = ['registry.v2.json', 'registry-item.v2.json', 'registries.v1.json']
  for (const f of schemaFiles) {
    await copyFile(join(REPO_ROOT, 'packages', 'registry', 'schema', f), join(schemaDir, f))
  }
  console.log(`Wrote per-item files to ${docsPublicR} and schemas to ${schemaDir}`)

  // Copy directory/registries.json to docs public
  const directorySrc = join(REPO_ROOT, 'directory', 'registries.json')
  if (existsSync(directorySrc)) {
    await copyFile(directorySrc, join(docsPublicR, 'registries.json'))
  }
}

await main()
