#!/usr/bin/env node
/**
 * Generates llms.txt and per-component markdown files for AI agents.
 * Reads registry.json and outputs to apps/docs/public/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_DIR = join(ROOT, 'apps', 'docs', 'public')
const LLMS_DIR = join(OUT_DIR, 'llms')

interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

interface ExampleMeta {
  title: string
  code: string
  description?: string
}

interface AccessibilityMeta {
  role: string
  wcag: string
  keyboard?: string[]
}

interface ComponentMeta {
  name: string
  description: string
  category: string
  states?: string[]
  variants?: string[]
  sizes?: string[]
  props?: PropMeta[]
  tokens?: string[]
  accessibility?: AccessibilityMeta
  examples?: ExampleMeta[]
  dependencies?: string[]
  tags?: string[]
}

interface RegistryEntry {
  name: string
  type: string
  description: string
  category: string
  version: string
  files: string[]
  dependencies?: string[]
  tags?: string[]
  meta?: ComponentMeta
}

interface Registry {
  version: string
  generatedAt: string
  components: RegistryEntry[]
}

function propsTable(props: PropMeta[]): string {
  if (props.length === 0) return '_No props._\n'
  const header = '| Prop | Type | Required | Default | Description |'
  const sep = '|------|------|----------|---------|-------------|'
  const rows = props.map((p) => {
    const def = p.default !== undefined ? `\`${p.default}\`` : '—'
    const desc = p.description ?? '—'
    return `| \`${p.name}\` | \`${p.type}\` | ${p.required ? 'yes' : 'no'} | ${def} | ${desc} |`
  })
  return [header, sep, ...rows].join('\n') + '\n'
}

function componentMarkdown(entry: RegistryEntry): string {
  const meta = entry.meta
  const lines: string[] = []

  lines.push(`# ${meta?.name ?? entry.name}`)
  lines.push('')
  lines.push(entry.description)
  lines.push('')

  lines.push('## Install')
  lines.push('')
  lines.push('```bash')
  lines.push(`npx cascade add ${entry.name}`)
  lines.push('```')
  lines.push('')

  lines.push('## Category')
  lines.push('')
  lines.push(`\`${entry.category}\``)
  lines.push('')

  if (meta?.variants && meta.variants.length > 0) {
    lines.push('## Variants')
    lines.push('')
    lines.push(meta.variants.map((v) => `- \`${v}\``).join('\n'))
    lines.push('')
  }

  if (meta?.sizes && meta.sizes.length > 0) {
    lines.push('## Sizes')
    lines.push('')
    lines.push(meta.sizes.map((s) => `- \`${s}\``).join('\n'))
    lines.push('')
  }

  if (meta?.states && meta.states.length > 0) {
    lines.push('## States')
    lines.push('')
    lines.push(meta.states.map((s) => `- \`${s}\``).join('\n'))
    lines.push('')
  }

  lines.push('## Props')
  lines.push('')
  lines.push(propsTable(meta?.props ?? []))

  if (meta?.examples && meta.examples.length > 0) {
    lines.push('## Examples')
    lines.push('')
    for (const ex of meta.examples) {
      lines.push(`### ${ex.title}`)
      lines.push('')
      if (ex.description) {
        lines.push(ex.description)
        lines.push('')
      }
      lines.push('```tsx')
      lines.push(ex.code)
      lines.push('```')
      lines.push('')
    }
  }

  if (meta?.tokens && meta.tokens.length > 0) {
    lines.push('## Design tokens')
    lines.push('')
    lines.push(meta.tokens.map((t) => `- \`${t}\``).join('\n'))
    lines.push('')
  }

  if (meta?.accessibility) {
    const a11y = meta.accessibility
    lines.push('## Accessibility')
    lines.push('')
    lines.push(`- **WCAG level:** ${a11y.wcag}`)
    lines.push(`- **ARIA role:** \`${a11y.role}\``)
    if (a11y.keyboard && a11y.keyboard.length > 0) {
      lines.push(`- **Keyboard:** ${a11y.keyboard.join(', ')}`)
    }
    lines.push('')
  }

  if (entry.dependencies && entry.dependencies.length > 0) {
    lines.push('## Dependencies')
    lines.push('')
    lines.push(entry.dependencies.map((d) => `- \`${d}\``).join('\n'))
    lines.push('')
  }

  if (entry.tags && entry.tags.length > 0) {
    lines.push('## Tags')
    lines.push('')
    lines.push(entry.tags.join(', '))
    lines.push('')
  }

  return lines.join('\n')
}

function generateLlmsTxt(registry: Registry, entries: RegistryEntry[]): string {
  const BASE_URL = 'https://cascade-ui.dev'
  const lines: string[] = []

  lines.push('# cascade — The CSS-native, signal-driven, AI-first React design system')
  lines.push('')
  lines.push(
    'cascade is a copy-paste component library (shadcn model). Users own the code they install.',
  )
  lines.push('Components are signal-driven (Preact Signals), styled with modern CSS, WCAG 2.1 AA.')
  lines.push('')
  lines.push('## Key resources')
  lines.push('')
  lines.push(`- Registry JSON: ${BASE_URL}/registry.json`)
  lines.push(`- View schema: ${BASE_URL}/view.v1.json`)
  lines.push(`- MCP server: npx @cascade-ui/mcp`)
  lines.push(`- llms.txt: ${BASE_URL}/llms.txt`)
  lines.push('')
  lines.push('## MCP tools')
  lines.push('')
  lines.push('- `list_components` — list all components with category/tags')
  lines.push('- `get_component` — full component manifest')
  lines.push('- `scaffold_view` — natural language → JSON view config')
  lines.push('- `validate_view` — validate a view config against the schema')
  lines.push('- `add_to_project` — install components into the user project')
  lines.push('')
  lines.push('## Component authoring rules (for cascade:extend)')
  lines.push('')
  lines.push('- Signals only: `useSignal`, `useComputed`, `useSignalEffect` from `@cascade-ui/core`')
  lines.push('- No `useState`, `useEffect`, `useContext`, `useLayoutEffect`, `useReducer`')
  lines.push('- DOM side effects via `useSignalEffect`, not `useEffect`')
  lines.push('- `useRef` only for DOM element references')
  lines.push('- CSS custom properties only — no Tailwind, no inline styles, no CSS-in-JS')
  lines.push('- Visual states (hover/focus/active) via CSS pseudo-classes — not JS')
  lines.push('- `data-state` attributes only for states CSS cannot express (e.g. loading, error)')
  lines.push('- FSM (`useMachine`) only when the component itself drives transitions')
  lines.push('- CSS logical properties throughout (RTL-safe): `margin-inline-start`, etc.')
  lines.push('- User-visible strings via `@cascade-ui/i18n` — no hardcoded English fallbacks')
  lines.push('- WCAG 2.1 AA minimum — keyboard navigable, screen-reader tested')
  lines.push('')
  lines.push('## Component index')
  lines.push('')

  // Sort deterministically
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of sorted) {
    lines.push(`- [${entry.name}](/llms/${entry.name}.md) — ${entry.description}`)
  }

  lines.push('')
  lines.push(`_Generated: ${registry.generatedAt} from registry v${registry.version}_`)
  lines.push('')

  return lines.join('\n')
}

function main() {
  const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  const entries = registry.components

  mkdirSync(LLMS_DIR, { recursive: true })

  // Generate per-component markdown
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of sorted) {
    const md = componentMarkdown(entry)
    const outPath = join(LLMS_DIR, `${entry.name}.md`)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, md, 'utf8')
  }

  // Generate llms.txt
  const llmsTxt = generateLlmsTxt(registry, entries)
  writeFileSync(join(OUT_DIR, 'llms.txt'), llmsTxt, 'utf8')

  console.log(`Generated llms.txt + ${sorted.length} component markdown files`)
}

main()
