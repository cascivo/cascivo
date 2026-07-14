#!/usr/bin/env node
/**
 * Generates llms.txt and per-component markdown files for AI agents.
 * Reads registry.json and outputs to apps/site/public/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_DIR = join(ROOT, 'apps', 'site', 'public')
const LLMS_DIR = join(OUT_DIR, 'llms')

interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

interface TypeFieldMeta {
  name: string
  type: string
  required?: boolean
  description?: string
}

interface TypeDefMeta {
  name: string
  description?: string
  fields: TypeFieldMeta[]
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
  typeDefs?: TypeDefMeta[]
  tokens?: string[]
  accessibility?: AccessibilityMeta
  examples?: ExampleMeta[]
  dependencies?: string[]
  tags?: string[]
}

interface ComponentIntent {
  whenToUse?: string[]
  whenNotToUse?: string[]
}

interface RegistryEntry {
  name: string
  type: string
  description: string
  category: string
  version: string
  files: string[]
  /** npm package to install (charts/flow/editor); absent for copy-paste entries. */
  install?: string
  /** stylesheet the npm package requires, e.g. `@cascivo/charts/styles.css`. */
  styles?: string
  dependencies?: string[]
  tags?: string[]
  meta?: ComponentMeta & { intent?: ComponentIntent }
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
  // Escape pipes so union types (`'sm' | 'md' | 'lg'`) don't spawn extra table
  // columns — even inside code spans, GFM tables treat a bare `|` as a cell
  // delimiter. Mirrors typeDefsSection() below.
  const esc = (s: string) => s.replace(/\|/g, '\\|')
  const rows = props.map((p) => {
    const type = esc(p.type)
    const def = p.default !== undefined ? `\`${esc(p.default)}\`` : '—'
    const desc = esc(p.description ?? '—')
    return `| \`${p.name}\` | \`${type}\` | ${p.required ? 'yes' : 'no'} | ${def} | ${desc} |`
  })
  return [header, sep, ...rows].join('\n') + '\n'
}

function typeDefsSection(typeDefs: TypeDefMeta[]): string {
  const lines: string[] = []
  for (const def of typeDefs) {
    lines.push(`### \`${def.name}\``)
    lines.push('')
    if (def.description) {
      lines.push(def.description)
      lines.push('')
    }
    lines.push('| Field | Type | Required | Description |')
    lines.push('|-------|------|----------|-------------|')
    for (const f of def.fields) {
      const type = f.type.replace(/\|/g, '\\|')
      const desc = (f.description ?? '—').replace(/\|/g, '\\|')
      lines.push(`| \`${f.name}\` | \`${type}\` | ${f.required ? 'yes' : 'no'} | ${desc} |`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/**
 * Which npm package (if any) exports a registry entry. Drives the import example.
 * - charts → @cascivo/charts
 * - components under packages/components/src → @cascivo/react (prebuilt)
 * - layouts/blocks/sections (packages/layouts/src) → null (copy-paste only, unpublished)
 */
function packageFor(entry: RegistryEntry): '@cascivo/react' | '@cascivo/charts' | null {
  if (entry.type === 'chart') return '@cascivo/charts'
  const first = entry.files?.[0] ?? ''
  if (first.includes('/packages/components/src/')) return '@cascivo/react'
  return null
}

/**
 * Terse distribution-channel marker for the llms.txt component index, so an
 * agent can see at a glance which package (if any) an entry comes from — the
 * single most-reported time sink was not knowing a component was copy-paste vs
 * a separate npm package.
 */
function channelLabel(entry: RegistryEntry): string {
  if (entry.install) return `npm ${entry.install}`
  if (packageFor(entry) === '@cascivo/react') return 'npm @cascivo/react · or copy-paste'
  return 'copy-paste'
}

function componentMarkdown(entry: RegistryEntry): string {
  const meta = entry.meta
  const lines: string[] = []

  lines.push(`# ${meta?.name ?? entry.name}`)
  lines.push('')
  lines.push(entry.description)
  lines.push('')

  const exportName = meta?.name ?? entry.name
  const pkg = packageFor(entry)

  lines.push('## Install')
  lines.push('')
  if (entry.install) {
    // npm-distributed (charts, flow, editor): install the package, no copy-paste.
    lines.push(`Ships in the \`${entry.install}\` package — install it (no copy-paste):`)
    lines.push('')
    lines.push('```sh')
    lines.push(`pnpm add ${entry.install}`)
    lines.push('```')
    lines.push('')
    lines.push('```tsx')
    lines.push(`import { ${exportName} } from '${entry.install}'`)
    if (entry.styles) {
      const note =
        entry.type === 'chart'
          ? 'required — without it the screen-reader data-table fallback renders visibly'
          : 'required stylesheet'
      lines.push(`import '${entry.styles}' // ${note}`)
    }
    lines.push('```')
    lines.push('')
  } else {
    lines.push('Copy-paste the source (you own and can edit it):')
    lines.push('')
    lines.push('```bash')
    lines.push(`npx cascivo add ${entry.name}`)
    lines.push('```')
    lines.push('')
    if (pkg === '@cascivo/react') {
      lines.push('Or use it from the prebuilt package without copying:')
      lines.push('')
      lines.push('```tsx')
      lines.push(`import { ${exportName} } from '@cascivo/react'`)
      lines.push('```')
      lines.push('')
    } else {
      lines.push('_Copy-paste only — this block/layout is not published as an importable package._')
      lines.push('')
    }
  }

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

  if (meta?.typeDefs && meta.typeDefs.length > 0) {
    lines.push('## Object types')
    lines.push('')
    lines.push(typeDefsSection(meta.typeDefs))
  }

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
  // Root-served (cascivo.com) vs docs-served (docs.cascivo.com). Per-component
  // markdown, context, and catalogs live only on the docs site, so link to them
  // absolutely — that way this file is correct whether it is fetched from
  // cascivo.com/llms.txt or docs.cascivo.com/llms.txt.
  const SITE = 'https://cascivo.com'
  const DOCS = 'https://docs.cascivo.com'
  const REPO = 'https://github.com/cascivo/cascivo'

  // Icon catalog count — generated by scripts/icons/generate.mjs (runs earlier
  // in `pnpm regen`). Tolerate its absence so a standalone llms:generate works.
  let iconCount = 0
  try {
    iconCount = (
      JSON.parse(readFileSync(join(OUT_DIR, 'icons.catalog.json'), 'utf8')) as { count: number }
    ).count
  } catch {
    iconCount = 0
  }

  const lines: string[] = []

  const chartCount = entries.filter((e) => e.type === 'chart').length
  const overlayCount = entries.filter((e) => e.category === 'overlay').length
  const blockCount = entries.filter((e) => e.type === 'block').length

  lines.push('# cascivo — The CSS-native, signal-driven, AI-first React design system')
  lines.push('')
  lines.push('cascivo is a React design system you can consume two ways: copy-paste the source')
  lines.push('(`npx cascivo add <name>` — shadcn model, you own the code) or install the prebuilt')
  lines.push('`@cascivo/react` package (use without copying). Components are signal-driven (Preact')
  lines.push(
    'Signals), styled with modern CSS (@layer / @container / :has() / oklch), themed via the',
  )
  lines.push(
    '`data-theme` attribute, and WCAG 2.2 AA. Every component ships a machine-readable manifest,',
  )
  lines.push('so this file plus the linked resources are enough to build with cascivo.')
  lines.push('')
  lines.push(
    `This is not a layout-only system: it includes ${overlayCount} overlay/menu components`,
  )
  lines.push(
    '(dropdown, menu, context menu, combobox, command palette, multi-select) with keyboard',
  )
  lines.push(
    'navigation, focus management, and outside-click dismissal already implemented — do not',
  )
  lines.push(
    `hand-roll that behavior or reach for a separate headless library. It also ships ${chartCount}`,
  )
  lines.push(
    `chart types (\`@cascivo/charts\` — line, area, bar, sparkline, KPI, heatmap, and more) and`,
  )
  lines.push(
    `${blockCount} pre-built page blocks (dashboards, stats cards, app shells) so a request like`,
  )
  lines.push(
    '"build a dashboard with usage sparklines and a project switcher" maps to existing parts —',
  )
  lines.push(
    'see `select_component`/`list_components` below before generating custom SVG or ARIA code.',
  )
  lines.push('')
  lines.push('## Start here')
  lines.push('')
  lines.push(`- Docs (per-component reference, props, live examples): ${DOCS}`)
  lines.push(`- Storybook (every variant, interactive): https://storybook.cascivo.com`)
  lines.push(`- Source (MIT): ${REPO}`)
  lines.push(`- This file: ${SITE}/llms.txt (mirrored at ${DOCS}/llms.txt)`)
  lines.push('')
  lines.push('## Machine-readable resources (AI-first)')
  lines.push('')
  lines.push(`- Registry — index of every component (JSON): ${SITE}/registry.json`)
  lines.push(`- Per-component AI docs (props, examples, a11y, tokens): ${DOCS}/llms/<name>.md`)
  lines.push(`- Per-component context (intent, when-to-use, boundaries): ${DOCS}/context/<name>.md`)
  lines.push(`- Context bundle (all intent + boundaries + rules): ${DOCS}/context.json`)
  lines.push(
    `- Token catalog (closed set, every --cascivo-* + layer + default): ${DOCS}/tokens.catalog.json`,
  )
  lines.push(
    `- Icon catalog (every @cascivo/icons icon + keywords/category): ${DOCS}/icons.catalog.json`,
  )
  lines.push(
    `- Breaking/feature changes (major+minor releases per package — detect API drift): ${DOCS}/breaking-changes.json`,
  )
  lines.push('')
  lines.push('## Icons')
  lines.push('')
  lines.push(
    `${iconCount} stroked 24×24 \`currentColor\` SVG icons ship as tree-shakeable named exports`,
  )
  lines.push("from `@cascivo/icons` (e.g. `import { Camera, Anchor } from '@cascivo/icons'`).")
  lines.push(`Browse and search them at ${DOCS}/icons; the full machine-readable list (names,`)
  lines.push(`keywords, categories) is ${DOCS}/icons.catalog.json.`)
  lines.push('')
  lines.push('## How to use it')
  lines.push('')
  lines.push('Two consumption paths — they share the same tokens/themes and can coexist:')
  lines.push('')
  lines.push('A. Prebuilt package — fastest, use without copying source:')
  lines.push('')
  lines.push('```sh')
  lines.push('pnpm add @cascivo/react @cascivo/themes @preact/signals-react')
  lines.push('```')
  lines.push('')
  lines.push('```tsx')
  lines.push("import '@cascivo/react/styles.css' // component styles (structure only)")
  lines.push("import '@cascivo/themes/all'       // tokens (once) + base typography + light & dark")
  lines.push("import { Button, Card } from '@cascivo/react'")
  lines.push('```')
  lines.push('')
  lines.push('   Trade-offs: smallest setup, updates via npm; you do not edit component internals.')
  lines.push('')
  lines.push('B. Copy-paste source — own and customize the code (shadcn model):')
  lines.push('')
  lines.push('```sh')
  lines.push('npx cascivo add button card')
  lines.push('```')
  lines.push('')
  lines.push('   Trade-offs: full control over internals; updates are a manual re-add.')
  lines.push('')
  lines.push(
    'Required CSS import order (both paths): components -> tokens+theme -> brand overrides (last).',
  )
  lines.push('`@cascivo/react/styles.css` is structure-only and needs a theme + tokens for color.')
  lines.push('')
  lines.push(
    'Charts, the code editor, and flow ship their own stylesheet: when you use them, import the',
  )
  lines.push("matching CSS once too — `import '@cascivo/charts/styles.css'` (likewise")
  lines.push(
    '`@cascivo/editor/styles.css`, `@cascivo/flow/styles.css`). Skipping the charts stylesheet is a',
  )
  lines.push("common mistake: the chart's screen-reader data-table fallback then renders visibly.")
  lines.push('')
  lines.push('## Versioning & compatibility')
  lines.push('')
  lines.push(
    'Packages version independently (changesets) — a low number on one package does not mean the',
  )
  lines.push(
    'whole system is behind. The compatibility truth is per-entry: every registry entry carries a',
  )
  lines.push(
    '`peerVersions` floor (e.g. `{ "@cascivo/i18n": ">=0.2.1" }`) for the packages its copied source',
  )
  lines.push(
    'needs. Pin exact versions, and after adding components run `cascivo doctor --drift` to catch an',
  )
  lines.push(
    `installed peer that is older than a copied component needs. Watch ${DOCS}/breaking-changes.json`,
  )
  lines.push('(major + minor releases per package) to detect API drift before upgrading.')
  lines.push('')
  lines.push('## Guides')
  lines.push('')
  lines.push(`- Theming & branding: ${REPO}/blob/main/docs/THEMING.md`)
  lines.push(`- Using cascivo with Preact: ${REPO}/blob/main/docs/USING-WITH-PREACT.md`)
  lines.push(`- Compatibility & support matrix: ${REPO}/blob/main/docs/COMPATIBILITY.md`)
  lines.push(`- Migrating from shadcn/ui: ${REPO}/blob/main/docs/MIGRATING-FROM-SHADCN.md`)
  lines.push(`- Token reference: ${REPO}/blob/main/docs/TOKENS.md`)
  lines.push('')
  lines.push('## Frameworks & browsers (summary; full matrix in COMPATIBILITY.md)')
  lines.push('')
  lines.push(
    '- React 18/19, Next.js App Router (RSC), Vite, Astro islands, Preact 10 (preact/compat — verified).',
  )
  lines.push(
    '- Last 2 versions of Chrome/Firefox/Safari (requires @layer, @container, :has(), oklch()).',
  )
  lines.push(
    "- CSS @function is opt-in (`import '@cascivo/tokens/functions.css'`); not auto-loaded, so",
  )
  lines.push('  lightningcss / Tailwind v4 pipelines work by default.')
  lines.push('')
  lines.push('## MCP server (recommended for agents)')
  lines.push('')
  lines.push('Point any MCP client at the cascivo server:')
  lines.push('')
  lines.push('```json')
  lines.push(
    '{ "mcpServers": { "cascivo": { "command": "npx", "args": ["-y", "@cascivo/mcp"] } } }',
  )
  lines.push('```')
  lines.push('')
  lines.push('Tools:')
  lines.push('- `list_components` — list all components with category/tags')
  lines.push('- `get_component` — full manifest for one component')
  lines.push('- `get_context` — intent + boundaries + tokens for one component')
  lines.push('- `get_tokens` — closed-set token catalog (filter by group/layer)')
  lines.push('- `select_component` — rank components by a natural-language need')
  lines.push('- `scaffold_view` — natural language -> JSON view config')
  lines.push('- `validate_view` — validate a view config against the schema')
  lines.push('- `add_to_project` — install components into the user project')
  lines.push('')
  lines.push(
    'To pick a component without MCP, read the intent summaries below (grouped by need) or',
  )
  lines.push(`fetch ${DOCS}/context/<name>.md for the full when-to-use / when-not-to-use of each.`)
  lines.push('')
  lines.push('## Component authoring rules (for cascivo:extend / custom components)')
  lines.push('')
  lines.push('- Signals only: `useSignal`, `useComputed`, `useSignalEffect` from `@cascivo/core`')
  lines.push('- No `useState`, `useEffect`, `useContext`, `useLayoutEffect`, `useReducer`')
  lines.push('- DOM side effects via `useSignalEffect`, not `useEffect`')
  lines.push('- `useRef` only for DOM element references')
  lines.push('- CSS custom properties only — no Tailwind, no inline styles, no CSS-in-JS')
  lines.push('- Visual states (hover/focus/active) via CSS pseudo-classes — not JS')
  lines.push('- `data-state` attributes only for states CSS cannot express (e.g. loading, error)')
  lines.push('- FSM (`useMachine`) only when the component itself drives transitions')
  lines.push('- CSS logical properties throughout (RTL-safe): `margin-inline-start`, etc.')
  lines.push('- User-visible strings via `@cascivo/i18n` — no hardcoded English fallbacks')
  lines.push('- WCAG 2.2 AA minimum — keyboard navigable, screen-reader tested')
  lines.push('')
  lines.push('## High-throughput / streaming data')
  lines.push('')
  lines.push(
    'For live logs, build output, market ticks, or streamed tokens, do NOT rebuild an array per',
  )
  lines.push(
    'event (`arr = [...arr.slice(1), line]` is O(n) per line and thrashes rendering). Use the',
  )
  lines.push('built-in primitives, which coalesce bursts to one render per frame:')
  lines.push('')
  lines.push(
    '- `useStreamBuffer` / `createStreamBuffer` (`@cascivo/core`) — fixed-capacity O(1) ring buffer,',
  )
  lines.push('  rAF-coalesced; a burst within one frame is a single signal write.')
  lines.push(
    '- `useStreamSeries` / `bindStream` (`@cascivo/charts`) — feed a live source into a chart with',
  )
  lines.push(
    '  optional LTTB/min-max decimation so a fast stream never blows the rendered point count.',
  )
  lines.push(
    '- `LogViewer` (`@cascivo/react`) — virtualized console for high-frequency logs (100k-line buffer',
  )
  lines.push(
    '  stays responsive), ANSI parsing, auto-follow tail. Pairs with `createStreamBuffer`.',
  )
  lines.push('')
  lines.push('## Feedback signals for agents')
  lines.push('')
  lines.push(
    'cascivo ships no runtime telemetry (copy-paste model — you own the code; no phone-home). To',
  )
  lines.push(
    'see how components behave without adding tracking, read these machine-readable CI outputs:',
  )
  lines.push('')
  lines.push(`- Breaking/feature changes per package: ${DOCS}/breaking-changes.json`)
  lines.push(
    `- Benchmark results (runtime, bundle, render counts vs Carbon/shadcn): ${REPO}/blob/main/apps/bench/results/results.json`,
  )
  lines.push(`- Accessibility conformance (axe sweep, AT matrix): ${REPO}/tree/main/docs/specs`)
  lines.push('')

  // Sort deterministically, then group the index by category.
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  const categories = [...new Set(sorted.map((e) => e.category))].sort()

  lines.push(`## Component index (${sorted.length} components)`)
  lines.push('')
  for (const category of categories) {
    lines.push(`### ${category}`)
    lines.push('')
    for (const entry of sorted.filter((e) => e.category === category)) {
      lines.push(
        `- [${entry.name}](${DOCS}/llms/${entry.name}.md) — ${entry.description} _(${channelLabel(entry)})_`,
      )
    }
    lines.push('')
  }

  lines.push('## Component intent summaries (use when…)')
  lines.push('')
  for (const entry of sorted) {
    const firstWhenToUse = entry.meta?.intent?.whenToUse?.[0]
    if (firstWhenToUse) {
      lines.push(
        `- [${entry.meta?.name ?? entry.name}](${DOCS}/context/${entry.name}.md) — Use when: ${firstWhenToUse}`,
      )
    }
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

  // Generate llms.txt. It uses absolute URLs throughout. The unified site serves
  // it from cascivo.com/llms.txt.
  const llmsTxt = generateLlmsTxt(registry, entries)
  writeFileSync(join(OUT_DIR, 'llms.txt'), llmsTxt, 'utf8')

  console.log(`Generated llms.txt + ${sorted.length} component markdown files`)
}

main()
