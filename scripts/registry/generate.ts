/**
 * Generates `registry.json` from every component manifest in
 * `packages/components/src/`.
 *
 * For each component it reads the `*.meta.ts` manifest and lists the
 * copy-paste source files (`.tsx` + `.module.css`), turning each into a raw
 * source URL. The base URL is configurable via `REGISTRY_BASE_URL` so the
 * script works before the public GitHub repo exists.
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
const COMPONENTS_DIR = join(REPO_ROOT, 'packages', 'components', 'src')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

const BASE_URL = (
  process.env.REGISTRY_BASE_URL ?? 'https://raw.githubusercontent.com/urbanisierung/cascade-ui/main'
).replace(/\/+$/, '')

interface RegistryComponent {
  name: string
  description: string
  category: string
  version: string
  files: string[]
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

async function buildEntry(name: string, version: string): Promise<RegistryComponent> {
  const dir = join(COMPONENTS_DIR, name)
  const metaPath = join(dir, `${name}.meta.ts`)
  const mod = (await import(pathToFileURL(metaPath).href)) as { meta: ComponentMeta }
  const meta = mod.meta

  const files = (await readdir(dir))
    .filter(isSourceFile)
    .sort(sortFiles)
    .map((file) => `${BASE_URL}/packages/components/src/${name}/${file}`)

  return {
    name,
    description: meta.description,
    category: meta.category,
    version,
    files,
    dependencies: meta.dependencies,
    tags: meta.tags,
    meta,
  }
}

/** Run the repo formatter over registry.json so committed output is stable. */
function formatRegistry(): void {
  const vp = join(REPO_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'vp.cmd' : 'vp')
  if (!existsSync(vp)) return
  spawnSync(vp, ['fmt', REGISTRY_PATH], { cwd: REPO_ROOT, stdio: 'ignore' })
}

async function main(): Promise<void> {
  const version = await readComponentVersion()
  const dirents = await readdir(COMPONENTS_DIR, { withFileTypes: true })
  const names = dirents
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  const components: RegistryComponent[] = []
  for (const name of names) {
    components.push(await buildEntry(name, version))
  }

  const registry = {
    version,
    generatedAt: new Date().toISOString().slice(0, 10),
    components,
  }

  await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
  formatRegistry()
  console.log(`Wrote ${components.length} components to registry.json (base: ${BASE_URL})`)
}

await main()
