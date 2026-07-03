/**
 * Generates Storybook stories from component manifests — realising CLAUDE.md's
 * "auto-generated stories from manifests" goal. Two sections:
 *
 *  1. Flow: for each `packages/flow/src/flows/<name>/<name>.meta.ts`, emits
 *     `apps/storybook/stories/flow/<name>.stories.tsx` with one story per
 *     `meta.examples[]` entry (each example's `code` is a renderable arrow
 *     component).
 *
 *  2. Components: for every `registry.json` entry of type `component` with no
 *     hand-written story, emits
 *     `apps/storybook/stories/generated/<name>.stories.tsx` with one story per
 *     compilable `meta.examples[]` entry (each example's `code` is a JSX
 *     expression). Examples referencing free identifiers (`isOpen`,
 *     `setValue`, placeholder components…) are skipped; components with no
 *     surviving example are listed in COMPONENT_STORY_EXCLUSIONS in
 *     scripts/quality/story-check.ts.
 *
 * Chained into `pnpm regen`; the drift gate catches staleness.
 *
 * Run with: `pnpm stories:generate`.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ComponentMeta, ExampleMeta } from '@cascivo/core'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const FLOWS_DIR = join(REPO_ROOT, 'packages', 'flow', 'src', 'flows')
const OUT_DIR = join(REPO_ROOT, 'apps', 'storybook', 'stories', 'flow')
const STORIES_DIR = join(REPO_ROOT, 'apps', 'storybook', 'stories')
const GENERATED_DIR = join(STORIES_DIR, 'generated')

/** Public flow component exports a generated story may reference. */
const FLOW_COMPONENTS = [
  'Flow',
  'FlowCanvas',
  'FlowBackground',
  'FlowNode',
  'FlowHandle',
  'FlowEdge',
  'FlowControls',
  'FlowMiniMap',
  'FlowPanel',
  'FlowStory',
]

const HEADER = '// AUTO-GENERATED — do not edit; run `pnpm stories:generate`.'

function pascal(input: string): string {
  const parts = input
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  return /^[A-Za-z]/.test(name) ? name : `Story${name}`
}

function uniqueExportNames(examples: ExampleMeta[]): string[] {
  const seen = new Map<string, number>()
  return examples.map((ex, i) => {
    let base = pascal(ex.title || `Example ${i + 1}`)
    if (seen.has(base)) {
      const n = (seen.get(base) ?? 1) + 1
      seen.set(base, n)
      base = `${base}${n}`
    } else {
      seen.set(base, 1)
    }
    return base
  })
}

function referencedComponents(code: string): string[] {
  return FLOW_COMPONENTS.filter((c) => new RegExp(`\\b${c}\\b`).test(code))
}

function storyFile(meta: ComponentMeta): string {
  const examples = meta.examples
  const combined = examples.map((e) => e.code).join('\n')
  const imports = referencedComponents(combined)
  const exportNames = uniqueExportNames(examples)

  const lines: string[] = [HEADER, `import type { Meta, StoryObj } from '@storybook/react-vite'`]
  if (imports.length > 0) {
    lines.push(`import { ${imports.join(', ')} } from '@cascivo/flow'`)
  }
  lines.push(
    '',
    `const meta: Meta = {`,
    `  title: 'Flow/${meta.name}',`,
    `  parameters: { layout: 'fullscreen' },`,
    `  decorators: [`,
    `    (Story) => (`,
    `      <div style={{ inlineSize: 'min(56rem, 92vw)', padding: '1.5rem' }}>`,
    `        <Story />`,
    `      </div>`,
    `    ),`,
    `  ],`,
    `}`,
    `export default meta`,
    `type Story = StoryObj`,
    '',
  )

  examples.forEach((ex, i) => {
    lines.push(`export const ${exportNames[i]}: Story = {`)
    lines.push(`  name: ${JSON.stringify(ex.title)},`)
    lines.push(`  render: ${ex.code},`)
    lines.push(`}`)
    lines.push('')
  })

  return `${lines.join('\n')}`
}

async function main(): Promise<void> {
  if (!existsSync(FLOWS_DIR)) {
    console.log('stories:generate: no flow package found — skipping.')
    return
  }
  await mkdir(OUT_DIR, { recursive: true })

  // Clear previously generated flow stories so removals don't leave orphans.
  for (const file of readdirSync(OUT_DIR)) {
    if (file.endsWith('.stories.tsx')) rmSync(join(OUT_DIR, file))
  }

  const dirs = readdirSync(FLOWS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  let count = 0
  for (const name of dirs) {
    const metaPath = join(FLOWS_DIR, name, `${name}.meta.ts`)
    if (!existsSync(metaPath)) continue
    const mod = (await import(pathToFileURL(metaPath).href)) as { meta: ComponentMeta }
    const meta = mod.meta
    if (!meta.examples || meta.examples.length === 0) continue
    writeFileSync(join(OUT_DIR, `${name}.stories.tsx`), `${storyFile(meta)}\n`, 'utf8')
    count++
  }

  console.log(`stories:generate: wrote ${count} flow story file(s) to ${OUT_DIR}`)
}

// --- Component stories (registry `component` entries without a story) --------

// TypeScript is not a root dependency; resolve it through a workspace package
// that declares it so the example analyser can parse JSX.
const requireFromReact = createRequire(join(REPO_ROOT, 'packages', 'react', 'package.json'))
const ts = requireFromReact('typescript') as typeof import('typescript')

/** Globals an example may reference without an import. */
const KNOWN_GLOBALS = new Set([
  'undefined',
  'Array',
  'Boolean',
  'Date',
  'Infinity',
  'Intl',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'Set',
  'String',
  'URL',
  'console',
  'document',
  'window',
])

interface RegistryEntry {
  name: string
  type?: string
  meta?: ComponentMeta
}

/** Kebab-case any PascalCase/camelCase/kebab name (matches story-check.ts). */
function toKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

/** Capitalized value exports (`export function X` / `export const X`) of a source file. */
function capitalizedExports(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8')
  return [...source.matchAll(/export (?:function|const) ([A-Z][A-Za-z0-9]*)/g)].map(
    (m) => m[1] as string,
  )
}

/**
 * Everything importable from '@cascivo/react': scan the source files its index
 * re-exports (all under packages/components/src) plus its named re-exports.
 */
function reactExports(): Set<string> {
  const indexPath = join(REPO_ROOT, 'packages', 'react', 'src', 'index.ts')
  const index = readFileSync(indexPath, 'utf8')
  const names = new Set<string>()
  for (const [, moduleSpec] of index.matchAll(/export \*(?: as \w+)? from '([^']+)'/g)) {
    const file = join(dirname(indexPath), `${moduleSpec}.tsx`)
    if (!existsSync(file)) continue
    for (const name of capitalizedExports(file)) names.add(name)
  }
  for (const [, names_] of index.matchAll(/export \{([^}]+)\} from '[^']+'/g)) {
    for (const raw of (names_ as string).split(',')) {
      const name = (raw.split(' as ').pop() ?? '').trim()
      if (/^[A-Z]/.test(name)) names.add(name)
    }
  }
  return names
}

interface ExampleAnalysis {
  ok: boolean
  reason?: string
  /** Free identifiers found in '@cascivo/react'. */
  components: Set<string>
  /** Free identifiers found in '@cascivo/icons' (and not in react). */
  icons: Set<string>
}

/**
 * Parse an example's `code` as a TSX expression and resolve every free
 * identifier against the '@cascivo/react' / '@cascivo/icons' export sets.
 * Fails (→ skip) on parse errors or unresolvable identifiers.
 */
function analyzeExample(
  code: string,
  componentSet: Set<string>,
  iconSet: Set<string>,
): ExampleAnalysis {
  const fail = (reason: string): ExampleAnalysis => ({
    ok: false,
    reason,
    components: new Set(),
    icons: new Set(),
  })

  const sf = ts.createSourceFile(
    'example.tsx',
    `const __probe = (\n${code}\n);`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const parseDiagnostics = (sf as unknown as { parseDiagnostics: unknown[] }).parseDiagnostics
  if (parseDiagnostics.length > 0) return fail('not a single JSX expression')

  const free = new Set<string>()

  function bindName(name: ts.BindingName, scope: Set<string>): void {
    if (ts.isIdentifier(name)) scope.add(name.text)
    else {
      for (const el of name.elements) {
        if (ts.isBindingElement(el)) bindName(el.name, scope)
      }
    }
  }

  function record(name: string, scope: ReadonlySet<string>): void {
    if (!scope.has(name)) free.add(name)
  }

  function visit(node: ts.Node, scope: ReadonlySet<string>): void {
    if (ts.isVariableDeclaration(node)) {
      // Only the wrapper `__probe` declaration reaches here (nested consts fail parse).
      if (node.initializer) visit(node.initializer, scope)
      return
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const inner = new Set(scope)
      for (const param of node.parameters) {
        if (param.initializer) visit(param.initializer, scope)
        bindName(param.name, inner)
      }
      visit(node.body, inner)
      return
    }
    if (ts.isPropertyAccessExpression(node)) {
      visit(node.expression, scope) // skip `.name`
      return
    }
    if (ts.isPropertyAssignment(node)) {
      if (ts.isComputedPropertyName(node.name)) visit(node.name.expression, scope)
      visit(node.initializer, scope) // skip literal property names
      return
    }
    if (ts.isShorthandPropertyAssignment(node)) {
      record(node.name.text, scope)
      return
    }
    if (ts.isJsxAttribute(node)) {
      if (node.initializer) visit(node.initializer, scope) // skip attribute names
      return
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName
      if (ts.isIdentifier(tag)) {
        if (/^[A-Z]/.test(tag.text)) record(tag.text, scope) // lowercase = intrinsic
      } else if (ts.isPropertyAccessExpression(tag)) {
        visit(tag.expression, scope)
      }
      visit(node.attributes, scope)
      return
    }
    if (ts.isJsxClosingElement(node)) return
    if (ts.isIdentifier(node)) {
      record(node.text, scope)
      return
    }
    ts.forEachChild(node, (child) => visit(child, scope))
  }

  visit(sf, new Set())

  const components = new Set<string>()
  const icons = new Set<string>()
  const unresolved: string[] = []
  for (const name of free) {
    if (componentSet.has(name)) components.add(name)
    else if (iconSet.has(name)) icons.add(name)
    else if (!KNOWN_GLOBALS.has(name)) unresolved.push(name)
  }
  if (unresolved.length > 0) return fail(`unresolvable identifier(s): ${unresolved.join(', ')}`)
  return { ok: true, components, icons }
}

/**
 * Manifest examples that parse and resolve but fail the storybook type check —
 * skipped by title until the manifest is fixed.
 */
const BROKEN_EXAMPLES: Record<string, Set<string>> = {
  // `<IconButton aria-label="More" />` omits IconButton's required `label` prop.
  user: new Set(['With action']),
}

const CATEGORY_TITLES: Record<string, string> = {
  inputs: 'Inputs',
  display: 'Display',
  overlay: 'Overlay',
  layout: 'Layout',
  feedback: 'Feedback',
  navigation: 'Navigation',
}

interface UsableExample {
  example: ExampleMeta
  components: Set<string>
  icons: Set<string>
}

function componentStoryFile(meta: ComponentMeta, usable: UsableExample[]): string {
  const componentImports = [...new Set(usable.flatMap((u) => [...u.components]))].sort()
  const iconImports = [...new Set(usable.flatMap((u) => [...u.icons]))].sort()
  const taken = new Set([...componentImports, ...iconImports])
  const exportNames = uniqueExportNames(usable.map((u) => u.example)).map((n) =>
    taken.has(n) ? `${n}Story` : n,
  )
  const title = `${CATEGORY_TITLES[meta.category] ?? pascal(meta.category)}/${meta.name}`

  const lines: string[] = [HEADER, `import type { Meta, StoryObj } from '@storybook/react-vite'`]
  if (componentImports.length > 0) {
    lines.push(`import { ${componentImports.join(', ')} } from '@cascivo/react'`)
  }
  if (iconImports.length > 0) {
    lines.push(`import { ${iconImports.join(', ')} } from '@cascivo/icons'`)
  }
  lines.push(
    '',
    `const meta: Meta = {`,
    `  title: ${JSON.stringify(title)},`,
    `}`,
    `export default meta`,
    `type Story = StoryObj`,
    '',
  )

  usable.forEach((u, i) => {
    const body = u.example.code
      .split('\n')
      .map((l) => (l.length > 0 ? `    ${l}` : l))
      .join('\n')
    lines.push(`export const ${exportNames[i]}: Story = {`)
    lines.push(`  name: ${JSON.stringify(u.example.title)},`)
    lines.push(`  render: () => (`)
    lines.push(body)
    lines.push(`  ),`)
    lines.push(`}`)
    lines.push('')
  })

  return lines.join('\n')
}

async function generateComponentStories(): Promise<void> {
  const registryPath = join(REPO_ROOT, 'registry.json')
  const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
    components?: RegistryEntry[]
  }
  const entries = (registry.components ?? []).filter((e) => (e.type ?? 'component') === 'component')

  // Wipe + rebuild so removals and newly hand-written stories don't leave orphans.
  rmSync(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(GENERATED_DIR, { recursive: true })

  // Hand-written story keys (generated/ was just wiped, so it never shadows).
  const storyKeys = new Set(
    readdirSync(STORIES_DIR, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.stories.tsx'))
      .map((e) => toKebab(e.name.replace(/\.stories\.tsx$/, ''))),
  )

  const componentSet = reactExports()
  const iconSet = new Set(
    capitalizedExports(join(REPO_ROOT, 'packages', 'icons', 'src', 'index.tsx')),
  )

  let written = 0
  const excluded: string[] = []
  for (const entry of entries) {
    const key = toKebab(entry.name.split('/').pop() ?? entry.name)
    if (storyKeys.has(key)) continue
    const meta = entry.meta
    const examples = meta?.examples ?? []

    const usable: UsableExample[] = []
    for (const example of examples) {
      if (BROKEN_EXAMPLES[entry.name]?.has(example.title)) {
        console.log(
          `stories:generate: skipping ${entry.name} example "${example.title}" — listed in BROKEN_EXAMPLES`,
        )
        continue
      }
      const analysis = analyzeExample(example.code, componentSet, iconSet)
      if (!analysis.ok) {
        console.log(
          `stories:generate: skipping ${entry.name} example "${example.title}" — ${analysis.reason}`,
        )
        continue
      }
      usable.push({ example, components: analysis.components, icons: analysis.icons })
    }

    if (!meta || usable.length === 0) {
      excluded.push(key)
      console.log(
        `stories:generate: no story for ${entry.name} — no compilable example (exclusion list)`,
      )
      continue
    }

    writeFileSync(
      join(GENERATED_DIR, `${key}.stories.tsx`),
      `${componentStoryFile(meta, usable)}\n`,
      'utf8',
    )
    written++
  }

  console.log(`stories:generate: wrote ${written} component story file(s) to ${GENERATED_DIR}`)
  if (excluded.length > 0) {
    console.log(
      `stories:generate: ${excluded.length} component(s) without a compilable example: ${excluded.join(', ')}`,
    )
  }
}

await main()
await generateComponentStories()
