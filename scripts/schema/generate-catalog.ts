/**
 * Generates `packages/render/schema/catalog.v1.json`, the protocol-neutral component catalog,
 * from registry.json manifests. Run with: `pnpm schema:generate`
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentNames } from '../../packages/render/src/component-names.ts'
import { toA2uiCatalog } from './a2ui.ts'
import {
  assertChildrenDeclared,
  buildCatalog,
  componentUsesChildren,
  pickCanonical,
} from './catalog-model.ts'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(REPO_ROOT, 'packages', 'render', 'schema', 'catalog.v1.json')

const registry: unknown = JSON.parse(readFileSync(join(REPO_ROOT, 'registry.json'), 'utf-8'))
function registryComponents(r: unknown): unknown[] {
  const list =
    typeof r === 'object' && r !== null ? (r as { components?: unknown }).components : null
  if (!Array.isArray(list)) throw new Error('registry.components: expected an array')
  return list
}
const RAW = 'https://raw.githubusercontent.com/cascivo/cascivo/main/'

// Manifest names with no same-named declaration: componentMap maps Toast to ToastProvider
// (packages/render/src/component-map.ts:157), so there is no `Toast` function to scan.
const NO_DECLARATION = new Set(['Toast'])

// Manifests own the slots; a component whose source renders children must declare the prop.
for (const [name, entry] of pickCanonical(registryComponents(registry))) {
  if (!componentNames.has(name)) continue
  const sources = entry.files
    .filter((f) => f.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(f))
    .map((f) => {
      if (!f.startsWith(RAW)) throw new Error(`${name}: unexpected file URL ${f}`)
      return join(REPO_ROOT, f.slice(RAW.length))
    })
  let found = false
  let uses = false
  for (const p of sources) {
    const u = componentUsesChildren(readFileSync(p, 'utf-8'), name)
    if (u === null) continue
    found = true
    uses ||= u
  }
  if (!found && !NO_DECLARATION.has(name)) {
    console.warn(`  warning: no declaration of ${name} found in its files; children not checked`)
  }
  assertChildrenDeclared(
    name,
    entry.meta.props.some((p) => p.name === 'children'),
    found ? uses : null,
  )
}

const catalog = buildCatalog(registry, componentNames)

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

// Runtime table for the A2UI renderer: which props are slots and which are events, nothing else.
const slotText = (s: { text?: true }): string => (s.text ? ', text: true' : '')
const rows = Object.entries(catalog.components).map(([name, c]) => {
  const slots = Object.entries(c.slots)
    .map(([k, s]) => `${JSON.stringify(k)}: { arity: '${s.arity}'${slotText(s)} }`)
    .join(', ')
  const events = Object.keys(c.events).map((e) => `'${e}'`)
  return `  ${JSON.stringify(name)}: { slots: { ${slots} }, events: [${events.join(', ')}] },`
})
writeFileSync(
  join(REPO_ROOT, 'packages', 'render', 'src', 'a2ui-catalog-data.ts'),
  `// generated — do not edit (scripts/schema/generate-catalog.ts)
export interface A2uiSlotInfo {
  readonly arity: 'one' | 'many'
  readonly text?: true
}
export interface A2uiComponentInfo {
  readonly slots: Readonly<Record<string, A2uiSlotInfo>>
  readonly events: readonly string[]
}
export const a2uiComponents: Readonly<Record<string, A2uiComponentInfo>> = {
${rows.join('\n')}
}
`,
  'utf-8',
)

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
