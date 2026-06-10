import type { CascadeConfig } from '../utils/config.js'
import { installPackages } from '../utils/exec.js'
import { resolveOutputPath, writeFileSafe } from '../utils/fs.js'
import { fetchRegistry, fileName, findComponent } from '../utils/registry.js'

/** Dependencies always present in a cascade project — never auto-installed. */
const ASSUMED_DEPS = new Set(['react', 'react-dom'])

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

export async function add(names: string[], config: CascadeConfig): Promise<void> {
  if (names.length === 0) {
    console.error('Usage: cascade add <component...>')
    return
  }

  const registry = await fetchRegistry(config.registry)
  const missingDeps = new Set<string>()

  for (const name of names) {
    const entry = findComponent(registry, name)
    if (!entry) {
      console.error(`Component "${name}" not found in registry. Run "cascade list".`)
      continue
    }

    for (const url of entry.files) {
      const content = await fetchText(url)
      const dest = resolveOutputPath(config.outputDir, entry.name, fileName(url))
      await writeFileSafe(dest, content)
    }

    for (const dep of entry.dependencies) {
      if (!ASSUMED_DEPS.has(dep)) missingDeps.add(dep)
    }

    console.log(`Added ${entry.name} to ${config.outputDir}/${entry.name}/`)
  }

  if (missingDeps.size > 0) {
    installPackages([...missingDeps])
  }
}
