import type { CascadeConfig } from '../utils/config.js'
import { parseAddress, resolveItemUrl } from '../utils/resolve.js'
import { fetchJson } from '../utils/http.js'
import type { RegistryItem } from '@cascade-ui/registry'

export async function view(args: string[], config: CascadeConfig): Promise<void> {
  const spec = args[0]
  if (!spec) {
    console.error('Usage: cascade view <component-spec>')
    return
  }

  const addr = parseAddress(spec)
  const { url, headers, params } = await resolveItemUrl(addr, config)
  const fetchOpts: Parameters<typeof fetchJson>[1] = {}
  if (headers) fetchOpts.headers = headers
  if (params) fetchOpts.params = params
  const item = (await fetchJson(url, fetchOpts)) as RegistryItem

  console.log(`\n${item.name}  v${item.version}`)
  console.log(`Type: ${item.type}${item.category ? ` / ${item.category}` : ''}`)
  console.log(`${item.description}`)
  if (item.author) console.log(`Author: ${item.author}`)
  if (item.license) console.log(`License: ${item.license}`)
  if (item.homepage) console.log(`Homepage: ${item.homepage}`)

  if (item.changelog?.length) {
    console.log('\nChangelog:')
    for (const c of item.changelog.slice(0, 5)) {
      console.log(`  ${c.version}: ${c.note}`)
    }
  }

  if (item.files?.length) {
    console.log('\nFiles:')
    for (const f of item.files) {
      const target = f.target ? ` → ${f.target}` : ''
      console.log(`  ${f.url}${target}`)
    }
  }

  if (item.dependencies?.length) {
    console.log(`\nDependencies: ${item.dependencies.join(', ')}`)
  }

  if (item.registryDependencies?.length) {
    console.log(`Registry dependencies: ${item.registryDependencies.join(', ')}`)
  }
}
