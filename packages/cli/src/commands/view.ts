import type { CascadeConfig } from '../utils/config.js'
import { parseAddress, resolveItemUrl } from '../utils/resolve.js'
import { fetchJson } from '../utils/http.js'
import { asTemplateMeta, isTemplateItem, type RegistryItem } from '@cascivo/registry'

/** Render an item's details as text. Pure, so it can be unit-tested. */
export function formatItem(item: RegistryItem): string {
  const lines: string[] = []
  lines.push(`\n${item.name}  v${item.version}`)
  lines.push(`Type: ${item.type}${item.category ? ` / ${item.category}` : ''}`)
  lines.push(item.description)
  if (item.author) lines.push(`Author: ${item.author}`)
  if (item.license) lines.push(`License: ${item.license}`)
  if (item.homepage) lines.push(`Homepage: ${item.homepage}`)

  if (isTemplateItem(item)) {
    try {
      const meta = asTemplateMeta(item.meta)
      lines.push(`\nTemplate: ${meta.intent}`)
      lines.push(`Framework: ${meta.framework}`)
      if (meta.demoUrl) lines.push(`Demo: ${meta.demoUrl}`)
      if (meta.pages?.length) {
        lines.push('Pages:')
        for (const p of meta.pages) lines.push(`  ${p.name} → ${p.target}`)
      }
    } catch {
      // meta is malformed — base fields above are still useful.
    }
  }

  if (item.changelog?.length) {
    lines.push('\nChangelog:')
    for (const c of item.changelog.slice(0, 5)) lines.push(`  ${c.version}: ${c.note}`)
  }

  if (item.files?.length) {
    lines.push('\nFiles:')
    for (const f of item.files) lines.push(`  ${f.url}${f.target ? ` → ${f.target}` : ''}`)
  }

  if (item.dependencies?.length) lines.push(`\nDependencies: ${item.dependencies.join(', ')}`)

  if (item.registryDependencies?.length) {
    const label = isTemplateItem(item) ? 'Components' : 'Registry dependencies'
    lines.push(`${label}: ${item.registryDependencies.join(', ')}`)
  }

  return lines.join('\n')
}

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

  console.log(formatItem(item))
}
