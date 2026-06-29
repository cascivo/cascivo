import { resolve as resolvePath } from 'node:path'
import type { CascadeConfig } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import {
  fetchRegistry,
  fileName,
  findComponent,
  type Registry,
  type RegistryComponent,
} from '../utils/registry.js'
import { createLock, readLock, sha256, updateLockEntry, writeLock } from '../utils/lock.js'
import { resolveClosure } from '../utils/resolve.js'
import { resolveFromDirectory } from '../utils/directory.js'
import { isTemplateItem, type RegistryItem } from '@cascivo/registry'

/** Dependencies always present in a cascade project — never auto-installed. */
const ASSUMED_DEPS = new Set(['react', 'react-dom'])

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

/** Resolve where a template's own file is written — relative to the project root. */
export function resolveTemplateTarget(cwd: string, target: string): string {
  return resolvePath(cwd, target)
}

export interface ResolvedBareEntry {
  entry: RegistryComponent
  /** True if reached via an original `cascivo add` argument; false if pulled as a transitive dependency. */
  requested: boolean
}

/**
 * Resolve the transitive closure of bare-name registry entries, following each
 * entry's `registryDependencies`. De-duped by resolved registry name and
 * cycle-safe (an entry is processed at most once). Returns resolved entries in
 * install order plus the names that could not be found. Pure — no I/O.
 */
export function resolveBareClosure(
  registry: Registry,
  bareSpecs: string[],
): { resolved: ResolvedBareEntry[]; missing: string[] } {
  const queue: { name: string; requested: boolean }[] = bareSpecs.map((name) => ({
    name,
    requested: true,
  }))
  const installed = new Set<string>()
  const resolved: ResolvedBareEntry[] = []
  const missing: string[] = []

  while (queue.length > 0) {
    const { name, requested } = queue.shift()!
    const entry = findComponent(registry, name)
    if (!entry) {
      missing.push(name)
      continue
    }
    if (installed.has(entry.name)) continue
    installed.add(entry.name)
    resolved.push({ entry, requested })
    for (const dep of entry.registryDependencies ?? []) {
      queue.push({ name: dep, requested: false })
    }
  }

  return { resolved, missing }
}

function isMultiRegistrySpec(name: string): boolean {
  return (
    name.startsWith('@') ||
    name.startsWith('http://') ||
    name.startsWith('https://') ||
    name.startsWith('./') ||
    name.startsWith('/') ||
    name.split('/').length >= 3
  )
}

export async function add(
  names: string[],
  config: CascadeConfig,
  opts: { dryRun?: boolean; yes?: boolean; cwd?: string } = {},
): Promise<void> {
  if (names.length === 0) {
    console.error('Usage: cascivo add <component...>')
    return
  }

  const cwd = opts.cwd ?? process.cwd()
  const multiSpecs = names.filter(isMultiRegistrySpec)
  const bareSpecs = names.filter((n) => !isMultiRegistrySpec(n))

  let lock = (await readLock(cwd)) ?? createLock()

  // Handle multi-registry specs (namespaces, URLs, GitHub)
  if (multiSpecs.length > 0) {
    const plan = await resolveClosure(multiSpecs, config, process.env, resolveFromDirectory)

    if (opts.dryRun) {
      console.log('Dry run — would install:')
      for (const item of plan.items) {
        const kind = isTemplateItem(item.item) ? ' [template]' : ''
        console.log(
          `  ${item.spec} (${item.item.name}@${item.item.version})${kind} from ${item.itemUrl}`,
        )
        for (const f of item.item.files) {
          const arrow = isTemplateItem(item.item) && f.target ? ` → ${f.target}` : ''
          console.log(`    ${f.url}${arrow}`)
        }
        if (item.item.registryDependencies?.length) {
          console.log(`    components: ${item.item.registryDependencies.join(', ')}`)
        }
      }
      return
    }

    const isThirdParty = (itemUrl: string) => !itemUrl.includes('cascivo.com')

    for (const { item, itemUrl, registryBase } of plan.items) {
      if (isThirdParty(itemUrl)) {
        console.log(
          `\nReview before use — files from non-directory registry: ${registryBase}\n` +
            (item.files ?? []).map((f) => `  ${f.url}`).join('\n'),
        )
      }

      const fileHashes = await installItem(item, config, cwd)
      lock = updateLockEntry(lock, item.name, {
        registry: registryBase,
        version: item.version,
        installedAt: new Date().toISOString().slice(0, 10),
        files: fileHashes,
      })
    }
    await writeLock(lock, cwd)
    return
  }

  // Legacy bare-name path (uses existing registry fetch).
  // Resolves the transitive closure of registry (component) dependencies so a
  // component that imports a shared hook/sibling (e.g. `../popover/use-popover`)
  // installs that dependency too. De-duped by resolved name; cycle-safe.
  const registry = await fetchRegistry(config.registry)
  const missingDeps = new Set<string>()
  const registryBase = config.registry.replace(/\/registry\.json$/, '').replace(/\/r$/, '')

  const { resolved, missing } = resolveBareClosure(registry, bareSpecs)
  for (const name of missing) {
    console.error(`Component "${name}" not found in registry. Run "cascivo list".`)
  }

  for (const { entry, requested } of resolved) {
    if (entry.type === 'chart') {
      const pkg = entry.install ?? '@cascivo/charts'
      console.log(`Chart "${entry.name}" is distributed as an npm package.`)
      console.log(`Install it with: npm install ${pkg}`)
      console.log(`Then import: import { ${entry.meta.name} } from '${pkg}'`)
      continue
    }

    const outputName = entry.name.includes('/') ? entry.name.split('/').pop()! : entry.name
    const fileHashes: Record<string, string> = {}

    for (const url of entry.files) {
      const content = await fetchText(url)
      const dest = resolveOutputPath(config.outputDir, outputName, fileName(url), cwd)
      await writeFileSafe(dest, content)
      fileHashes[dest] = sha256(content)
    }

    for (const dep of entry.dependencies) {
      if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
    }

    lock = updateLockEntry(lock, entry.name, {
      registry: registryBase,
      version: entry.version,
      installedAt: new Date().toISOString().slice(0, 10),
      files: fileHashes,
    })

    const suffix = requested ? '' : ' (dependency)'
    console.log(`Added ${entry.name} to ${config.outputDir}/${outputName}/${suffix}`)
  }

  if (missingDeps.size > 0) {
    installPackages([...missingDeps])
  }

  await writeLock(lock, cwd)
}

/**
 * Install a single resolved item, returning a map of written path → content
 * hash for the lockfile. A template writes its own files to their `target`
 * paths (relative to the project root); every other item writes its files under
 * the components output directory. A template's components are installed
 * separately as their own plan entries (via `registryDependencies`).
 */
async function installItem(
  item: RegistryItem,
  config: CascadeConfig,
  cwd: string,
): Promise<Record<string, string>> {
  const fileHashes: Record<string, string> = {}
  const missingDeps = new Set<string>()
  const template = isTemplateItem(item)
  const outputName = item.name.includes('/') ? item.name.split('/').pop()! : item.name

  for (const file of item.files ?? []) {
    try {
      const content = await fetchText(file.url)
      const dest =
        template && file.target
          ? resolveTemplateTarget(cwd, file.target)
          : resolveOutputPath(config.outputDir, outputName, fileName(file.url), cwd)
      await writeFileSafe(dest, content)
      fileHashes[dest] = sha256(content)
    } catch {
      console.warn(`  Could not fetch ${file.url}`)
    }
  }

  for (const dep of item.dependencies ?? []) {
    if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
  }

  if (missingDeps.size > 0) {
    installPackages([...missingDeps])
  }

  if (template) {
    const pages = item.files?.filter((f) => f.target).map((f) => f.target) ?? []
    console.log(`Installed template ${item.name} (${pages.length} files)`)
  } else {
    console.log(`Added ${item.name} to ${config.outputDir}/${outputName}/`)
  }

  return fileHashes
}
