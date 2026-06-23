/**
 * Generates Storybook stories for `@cascivo/flow` primitives from their
 * manifests — realising CLAUDE.md's "auto-generated stories from manifests"
 * goal. For each `packages/flow/src/flows/<name>/<name>.meta.ts`, emits
 * `apps/storybook/stories/flow/<name>.stories.tsx` with one story per
 * `meta.examples[]` entry (each example's `code` is a renderable arrow
 * component). Chained into `pnpm regen`; the drift gate catches staleness.
 *
 * Run with: `pnpm stories:generate`.
 */
import { existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { ComponentMeta, ExampleMeta } from '@cascivo/core'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const FLOWS_DIR = join(REPO_ROOT, 'packages', 'flow', 'src', 'flows')
const OUT_DIR = join(REPO_ROOT, 'apps', 'storybook', 'stories', 'flow')

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

await main()
