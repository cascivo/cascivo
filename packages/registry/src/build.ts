import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RegistryIndex, RegistryItem } from './types.ts'

function flatName(name: string): string {
  return name.replace(/\//g, '-')
}

function itemWithoutExamples(item: RegistryItem): RegistryItem {
  if (!item.meta?.examples?.length) return item
  return {
    ...item,
    meta: { ...item.meta, examples: [] },
  }
}

export async function buildRegistry(index: RegistryIndex, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const sortedItems = [...index.items].sort((a, b) => a.name.localeCompare(b.name))

  const indexOut: RegistryIndex = {
    schemaVersion: 2,
    name: index.name,
    ...(index.homepage ? { homepage: index.homepage } : {}),
    items: sortedItems.map(itemWithoutExamples),
  }
  await writeFile(join(outDir, 'registry.json'), `${JSON.stringify(indexOut, null, 2)}\n`, 'utf8')

  for (const item of sortedItems) {
    const flat = flatName(item.name)
    await writeFile(join(outDir, `${flat}.json`), `${JSON.stringify(item, null, 2)}\n`, 'utf8')
    await writeFile(
      join(outDir, `${flat}@${item.version}.json`),
      `${JSON.stringify(item, null, 2)}\n`,
      'utf8',
    )
  }
}
