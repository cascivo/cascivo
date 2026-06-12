import { createHash } from 'node:crypto'
import type { CascadeConfig } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import { fetchRegistry, fileName, findComponent } from '../utils/registry.js'
import { createLock, readLock, sha256, updateLockEntry, writeLock } from '../utils/lock.js'
import { parseAddress, resolveClosure } from '../utils/resolve.js'
import { resolveFromDirectory } from '../utils/directory.js'
import type { RegistryItem } from '@cascade-ui/registry'

/** Dependencies always present in a cascade project — never auto-installed. */
const ASSUMED_DEPS = new Set(['react', 'react-dom'])

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.text()
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
  opts: { dryRun?: boolean; yes?: boolean } = {},
): Promise<void> {
  if (names.length === 0) {
    console.error('Usage: cascade add <component...>')
    return
  }

  const multiSpecs = names.filter(isMultiRegistrySpec)
  const bareSpecs = names.filter((n) => !isMultiRegistrySpec(n))

  let lock = (await readLock()) ?? createLock()

  // Handle multi-registry specs (namespaces, URLs, GitHub)
  if (multiSpecs.length > 0) {
    const plan = await resolveClosure(multiSpecs, config, process.env, resolveFromDirectory)

    if (opts.dryRun) {
      console.log('Dry run — would install:')
      for (const item of plan.items) {
        console.log(`  ${item.spec} (${item.item.name}@${item.item.version}) from ${item.itemUrl}`)
        for (const f of item.item.files) {
          console.log(`    ${f.url}`)
        }
      }
      return
    }

    const isThirdParty = (itemUrl: string) => !itemUrl.includes('cascade-ui.dev')

    for (const { item, itemUrl, registryBase } of plan.items) {
      if (isThirdParty(itemUrl)) {
        console.log(
          `\nReview before use — files from non-directory registry: ${registryBase}\n` +
            (item.files ?? []).map((f) => `  ${f.url}`).join('\n'),
        )
      }

      await installItem(item, config, lock, registryBase)
      lock = updateLockEntry(lock, item.name, {
        registry: registryBase,
        version: item.version,
        installedAt: new Date().toISOString().slice(0, 10),
        files: {},
      })
    }
    await writeLock(lock)
    return
  }

  // Legacy bare-name path (uses existing registry fetch)
  const registry = await fetchRegistry(config.registry)
  const missingDeps = new Set<string>()

  for (const name of bareSpecs) {
    const entry = findComponent(registry, name)
    if (!entry) {
      console.error(`Component "${name}" not found in registry. Run "cascade list".`)
      continue
    }

    if (entry.type === 'chart') {
      const pkg = entry.install ?? '@cascade-ui/charts'
      console.log(`Chart "${entry.name}" is distributed as an npm package.`)
      console.log(`Install it with: npm install ${pkg}`)
      console.log(`Then import: import { ${entry.meta.name} } from '${pkg}'`)
      continue
    }

    const outputName = entry.name.includes('/') ? entry.name.split('/').pop()! : entry.name
    const fileHashes: Record<string, string> = {}

    for (const url of entry.files) {
      const content = await fetchText(url)
      const dest = resolveOutputPath(config.outputDir, outputName, fileName(url))
      await writeFileSafe(dest, content)
      fileHashes[dest] = sha256(content)
    }

    for (const dep of entry.dependencies) {
      if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
    }

    const registryBase = config.registry.replace(/\/registry\.json$/, '').replace(/\/r$/, '')
    lock = updateLockEntry(lock, entry.name, {
      registry: registryBase,
      version: entry.version,
      installedAt: new Date().toISOString().slice(0, 10),
      files: fileHashes,
    })

    console.log(`Added ${entry.name} to ${config.outputDir}/${outputName}/`)
  }

  if (missingDeps.size > 0) {
    installPackages([...missingDeps])
  }

  await writeLock(lock)
}

async function installItem(
  item: RegistryItem,
  config: CascadeConfig,
  _lock: ReturnType<typeof createLock>,
  _registryBase: string,
): Promise<void> {
  const outputName = item.name.includes('/') ? item.name.split('/').pop()! : item.name
  const missingDeps = new Set<string>()

  for (const file of item.files ?? []) {
    try {
      const content = await fetchText(file.url)
      const dest = resolveOutputPath(config.outputDir, outputName, fileName(file.url))
      await writeFileSafe(dest, content)
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

  console.log(`Added ${item.name} to ${config.outputDir}/${outputName}/`)
}
