import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { CascadeConfig } from '../utils/config.js'
import { fetchRegistry, type RegistryComponent } from '../utils/registry.js'

export interface ListOptions {
  installed?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  component: 'Components',
  layout: 'Layouts (copy-paste)',
  block: 'Blocks (copy-paste)',
  section: 'Sections (copy-paste)',
  chart: 'Charts (npm: @cascivo/charts)',
  flow: 'Flow (npm: @cascivo/flow)',
  editor: 'Editor (npm: @cascivo/editor)',
}

/** Render a group of entries as an aligned text table (no section header). */
function formatGroup(entries: RegistryComponent[]): string {
  const rows = entries.map((c) => [c.name, c.category, c.description] as const)
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

/** Render the component list as an aligned text table, grouped by type. */
export function formatList(components: RegistryComponent[]): string {
  if (components.length === 0) return 'No components found.'

  // Determine whether any entry has an explicit type — if not, render flat.
  const hasTypes = components.some((c) => c.type !== undefined)
  if (!hasTypes) return formatGroup(components)

  // Group by type, preserving insertion order of first occurrence.
  const groups = new Map<string, RegistryComponent[]>()
  for (const c of components) {
    const key = c.type ?? 'component'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }

  const sections: string[] = []
  for (const [key, entries] of groups) {
    const label = TYPE_LABELS[key] ?? key
    sections.push(`${label}\n${formatGroup(entries)}`)
  }
  return sections.join('\n\n')
}

export async function list(config: CascadeConfig, options: ListOptions = {}): Promise<void> {
  const registry = await fetchRegistry(config.registry)
  let components = registry.components

  if (options.installed) {
    components = components.filter((c) => {
      const outputName = c.name.includes('/') ? c.name.split('/').pop()! : c.name
      return existsSync(join(process.cwd(), config.outputDir, outputName))
    })
  }

  console.log(formatList(components))
  console.log(
    '\nTip: install any entry by its bare name — `cascivo add flex` resolves to ' +
      '`layout/flex`. Layout primitives (Flex, Grid, AutoGrid, Columns, Spacer, ' +
      'Center) replace inline-style layout; see docs/cookbooks/layout-and-spacing.md.',
  )
}
