import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CascadeConfig } from '../utils/config.js'
import { fetchRegistry, type RegistryComponent } from '../utils/registry.js'

export interface ListOptions {
  installed?: boolean
}

/** Render the component list as an aligned text table. */
export function formatList(components: RegistryComponent[]): string {
  if (components.length === 0) return 'No components found.'

  const rows = components.map((c) => [c.name, c.category, c.description] as const)
  const headers = ['Name', 'Category', 'Description'] as const
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)))

  const line = (cells: readonly string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i] ?? cell.length))
      .join('  ')
      .trimEnd()

  const sep = widths.map((w) => '-'.repeat(w)).join('  ')
  return [line(headers), sep, ...rows.map(line)].join('\n')
}

export async function list(config: CascadeConfig, options: ListOptions = {}): Promise<void> {
  const registry = await fetchRegistry(config.registry)
  let components = registry.components

  if (options.installed) {
    components = components.filter((c) => existsSync(join(process.cwd(), config.outputDir, c.name)))
  }

  console.log(formatList(components))
}
