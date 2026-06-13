import type { CascadeConfig } from '../utils/config.js'
import { fetchRegistry } from '../utils/registry.js'
import { fetchJson } from '../utils/http.js'
import type { RegistryItem } from '@cascade-ui/registry'

interface SearchResult {
  name: string
  version: string
  description: string
  registry?: string
}

function matchesQuery(item: RegistryItem, query: string): boolean {
  const q = query.toLowerCase()
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export async function search(args: string[], config: CascadeConfig): Promise<void> {
  const nsFlag = args.indexOf('--registry')
  const registryFilter = nsFlag !== -1 ? args[nsFlag + 1] : undefined
  const queryParts = args.filter((a, i) => a !== '--registry' && args[i - 1] !== '--registry')
  const query = queryParts.join(' ').trim()

  if (!query) {
    console.error('Usage: cascade search <query> [--registry @ns]')
    return
  }

  const results: SearchResult[] = []

  if (!registryFilter) {
    // Search default registry
    const registry = await fetchRegistry(config.registry)
    for (const c of registry.components) {
      const item = c as unknown as RegistryItem
      if (matchesQuery(item, query)) {
        results.push({ name: c.name, version: c.version, description: c.description })
      }
    }
  }

  // Search configured namespace registries
  const registries = config.registries ?? {}
  for (const [ns, nsCfg] of Object.entries(registries)) {
    if (registryFilter && ns !== registryFilter) continue
    try {
      const template = typeof nsCfg === 'string' ? nsCfg : nsCfg.url
      const indexUrl = template.replace(/{name}[^$]*$/, '').replace(/\/$/, '') + '/registry.json'
      const raw = (await fetchJson(indexUrl)) as { items?: RegistryItem[] }
      for (const item of raw.items ?? []) {
        if (matchesQuery(item, query)) {
          results.push({
            name: `${ns}/${item.name}`,
            version: item.version,
            description: item.description,
            registry: ns,
          })
        }
      }
    } catch {
      console.warn(`  [warn] Could not search ${ns} registry`)
    }
  }

  if (results.length === 0) {
    console.log('No results found.')
    return
  }

  for (const r of results) {
    const reg = r.registry ? ` (${r.registry})` : ''
    console.log(`${r.name}@${r.version}${reg} — ${r.description}`)
  }
}
