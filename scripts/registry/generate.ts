/**
 * Generates `registry.json` from component/layout/block manifests.
 *
 * Scans multiple source roots and produces a flat `components` array tagged
 * with a `type` field so consumers can filter by category of entry.
 *
 * Run with: `pnpm registry:generate` (or `vp run registry:generate`).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ComponentMeta } from '@cascade-ui/core'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

const BASE_URL = (
  process.env.REGISTRY_BASE_URL ?? 'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main'
).replace(/\/+$/, '')

type EntryType = 'component' | 'layout' | 'block' | 'chart'

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
    skipDirs: ['blocks'],
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
]

interface RegistryComponent {
  name: string
  type: EntryType
  description: string
  category: string
  version: string
  files: string[]
  /** npm package to install instead of copying files (used for type: 'chart'). */
  install?: string
  dependencies: string[]
  tags: string[]
  /** Full component manifest — consumed by the MCP server and docs. */
  meta: ComponentMeta
}

/** Files that make up a copy-paste component, in a stable display order. */
function isSourceFile(file: string): boolean {
  if (file.endsWith('.test.tsx')) return false
  return file.endsWith('.tsx') || file.endsWith('.module.css')
}

function sortFiles(a: string, b: string): number {
  const rank = (f: string) => (f.endsWith('.tsx') ? 0 : 1)
  return rank(a) - rank(b) || a.localeCompare(b)
}

async function readComponentVersion(): Promise<string> {
  const pkg = JSON.parse(
    await readFile(join(REPO_ROOT, 'packages', 'components', 'package.json'), 'utf8'),
  ) as { version: string }
  return pkg.version
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

  const isChart = root.type === 'chart'

  const files = isChart
    ? []
    : (await readdir(dir))
        .filter(isSourceFile)
        .sort(sortFiles)
        .map((file) => `${BASE_URL}/${relDir}/${file}`)

  const entry: RegistryComponent = {
    name: `${root.prefix}${localName}`,
    type: root.type,
    description: meta.description,
    category: meta.category,
    version,
    files,
    dependencies: meta.dependencies,
    tags: meta.tags,
    meta,
  }
  if (isChart) {
    entry.install = '@cascade-ui/charts'
  }
  return entry
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
function formatRegistry(): void {
  const vp = join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vp.cmd' : 'vp')
  if (!existsSync(vp)) return
  spawnSync(vp, ['fmt', REGISTRY_PATH], { cwd: REPO_ROOT, stdio: 'ignore' })
}

async function main(): Promise<void> {
  const version = await readComponentVersion()

  const components: RegistryComponent[] = []
  for (const root of ROOTS) {
    const entries = await scanRoot(root, version)
    components.push(...entries)
  }

  const registry = {
    version,
    generatedAt: new Date().toISOString().slice(0, 10),
    components,
  }

  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  formatRegistry()
  console.log(`Wrote ${components.length} entries to registry.json (base: ${BASE_URL})`)
}

await main()
