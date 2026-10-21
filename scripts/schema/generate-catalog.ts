/**
 * Generates `packages/render/schema/catalog.v1.json`, the protocol-neutral component catalog,
 * from registry.json manifests. Run with: `pnpm schema:generate`
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentNames } from '../../packages/render/src/component-names.ts'
import { toA2uiCatalog } from './a2ui.ts'
import { buildCatalog, canonicalFiles, componentUsesChildren } from './catalog-model.ts'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(REPO_ROOT, 'packages', 'render', 'schema', 'catalog.v1.json')

const registry: unknown = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf-8'))
const RAW = 'https://raw.githubusercontent.com/cascivo/cascivo/main/'

// Manifest names with no same-named declaration: componentMap maps Toast to ToastProvider
// (packages/render/src/component-map.ts:157), so there is no `Toast` function to scan.
const NO_DECLARATION = new Set(['Toast'])

const implicitChildren = new Set<string>()
for (const [name, files] of canonicalFiles(registry)) {
  const sources = files
    .filter((f) => f.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(f))
    .map((f) => {
      if (!f.startsWith(RAW)) throw new Error(`${name}: unexpected file URL ${f}`)
      return join(REPO_ROOT, f.slice(RAW.length))
    })
  let found = false
  for (const p of sources) {
    const uses = componentUsesChildren(readFileSync(p, 'utf-8'), name)
    if (uses === null) continue
    found = true
    if (uses) implicitChildren.add(name)
  }
  if (!found && componentNames.has(name) && !NO_DECLARATION.has(name)) {
    console.warn(`  warning: no declaration of ${name} found in its files; no implicit children`)
  }
}

const catalog = buildCatalog(registry, componentNames, implicitChildren)

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n', 'utf-8')

// Identical bytes in the package and the site, so the catalogId URL resolves to the published file.
const a2ui = JSON.stringify(toA2uiCatalog(catalog), null, 2) + '\n'
for (const p of [
  join(REPO_ROOT, 'packages', 'render', 'schema', 'a2ui', 'v0_9', 'catalog.json'),
  join(REPO_ROOT, 'apps', 'site', 'public', 'a2ui', 'v0_9', 'catalog.json'),
]) {
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, a2ui, 'utf-8')
}

let data = 0
let slots = 0
let events = 0
let omitted = 0
const reasons: Record<string, number> = {}
for (const c of Object.values(catalog.components)) {
  data += Object.keys(c.props.properties).length
  slots += Object.keys(c.slots).length
  events += Object.keys(c.events).length
  for (const o of Object.values(c.omitted)) {
    omitted++
    reasons[o.reason] = (reasons[o.reason] ?? 0) + 1
  }
}
const by = Object.entries(reasons)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([r, n]) => `${r} ${n}`)
  .join(', ')
console.log(`Generated ${OUT}`)
console.log(
  `  components ${Object.keys(catalog.components).length} · data ${data} · slots ${slots} · events ${events} · omitted ${omitted} (${by})`,
)
