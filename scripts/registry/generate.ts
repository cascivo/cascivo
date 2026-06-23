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
import type { ComponentMeta } from '@cascivo/core'
import {
  buildRegistry,
  parseLegacyRegistry,
  writeShadcnRegistry,
} from '../../packages/registry/src/index.ts'
import type { BlockMeta } from '../../packages/components/src/blocks/types.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
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

  // Charts, flow primitives, and the editor are npm-installed (not copy-pasted): empty files.
  const isNpmInstalled = root.type === 'chart' || root.type === 'flow' || root.type === 'editor'

  const files = isNpmInstalled
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
  if (root.type === 'chart') {
    entry.install = '@cascivo/charts'
  } else if (root.type === 'flow') {
    entry.install = '@cascivo/flow'
  } else if (root.type === 'editor') {
    entry.install = '@cascivo/editor'
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

  const blocks = await scanBlocks(version)

  const registry = {
    version,
    generatedAt: new Date().toISOString().slice(0, 10),
    components,
    blocks,
  }

  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  formatRegistry()
  console.log(
    `Wrote ${components.length} component entries and ${blocks.length} block entries to registry.json (base: ${BASE_URL})`,
  )

  // Emit per-item static files under apps/docs/public/r/
  const docsPublicR = join(REPO_ROOT, 'apps', 'docs', 'public', 'r')
  const index = parseLegacyRegistry(registry)
  await buildRegistry(index, docsPublicR)

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
  console.log(`Wrote shadcn-compatible registry to ${shadcnDir}`)

  // Copy JSON Schemas to docs public
  const schemaDir = join(REPO_ROOT, 'apps', 'docs', 'public', 'schema')
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
