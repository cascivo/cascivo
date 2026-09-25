/**
 * Writes the A2UI and json-render catalogs (see ./catalogs.ts) to apps/site/public, where
 * the A2UI catalog is served at its own `catalogId` URL.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { propSchemas } from '../../packages/render/src/prop-schemas.ts'
import {
  a2uiCatalog,
  jsonRenderModule,
  renderableNames,
  type CatalogComponent,
} from './catalogs.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const registry = JSON.parse(await readFile(join(ROOT, 'registry.json'), 'utf8')) as {
  components: { description: string; meta?: { name?: string } }[]
}
const descriptions = new Map(registry.components.map((c) => [c.meta?.name, c.description]))

// Sub-parts `<CascivoView>` renders that have no manifest of their own, so no registry
// description and no prop schema. Their props go unchecked, as the validator leaves them.
const SUBPARTS: Record<string, string> = {
  GridItem: 'One cell of a Grid, spanning columns and rows.',
  RadioCardGroup: 'Groups RadioCard options into one single-choice field.',
}

const components: CatalogComponent[] = renderableNames(ROOT).map((name) => {
  const description = descriptions.get(name) ?? SUBPARTS[name]
  if (description === undefined) {
    throw new Error(`${name} is in component-map.ts but has no registry entry — add it to SUBPARTS`)
  }
  return { name, description, props: propSchemas[name] }
})

const outputs: [string, string][] = [
  ['a2ui/v0_9/catalog.json', `${JSON.stringify(a2uiCatalog(components), null, 2)}\n`],
  ['json-render/catalog.tsx', jsonRenderModule(components)],
]
for (const [path, text] of outputs) {
  const file = join(ROOT, 'apps/site/public', path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, text)
}
console.log(`render catalogs: ${components.length} components (A2UI v0.9, json-render)`)
