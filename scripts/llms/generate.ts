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

/** Raw block entry from registry.json's top-level `blocks` array. */
interface RawBlock {
  name: string
  type: string
  displayName?: string
  description?: string
  category?: string
  version?: string
  files?: string[]
  dependencies?: string[]
  tags?: string[]
  intent?: ComponentIntent
}

interface Registry {
  version: string
  generatedAt: string
  components: RegistryEntry[]
  blocks?: RawBlock[]
}

/**
 * Normalize the top-level `blocks` array into RegistryEntry shape so page blocks
 * get the same per-entry `.md`, index listing, and intent summary as components.
 * Bare block names are prefixed `block/` (matching the CLI's `block/<name>`
 * addressing and the `/r/shadcn/block-<name>.json` slug); `displayName` becomes
 * the doc title, and `intent` is threaded so the llms.txt "use when…" summary
 * covers blocks too.
 */
function blockEntries(registry: Registry): RegistryEntry[] {
  return (registry.blocks ?? []).map((b): RegistryEntry => {
    const name = b.name.startsWith('block/') ? b.name : `block/${b.name}`
    return {
      name,
      type: 'block',
      description: b.description ?? '',
      category: b.category ?? 'blocks',
      version: b.version ?? registry.version,
      files: b.files ?? [],
      dependencies: b.dependencies,
      tags: b.tags,
      meta: { name: b.displayName ?? name, intent: b.intent } as RegistryEntry['meta'],
    }
  })
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
  // Blocks are copy-paste only (`npx cascivo add block/<name>`) even though their
  // source lives under packages/components/src/blocks — they are not importable as
  // named exports from @cascivo/react, so don't advertise an npm import for them.
  if (entry.type === 'block') return null
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

/** Display name used for the H1 and for same-name collision detection. */
function displayNameOf(entry: RegistryEntry): string {
  return entry.meta?.name ?? entry.name
}

function componentMarkdown(entry: RegistryEntry, siblings: RegistryEntry[] = []): string {
  const meta = entry.meta
  const lines: string[] = []

  lines.push(`# ${displayNameOf(entry)}`)
  lines.push('')
  lines.push(entry.description)
  lines.push('')

  // Same-name disambiguation. Several distinct entries share a display name
  // (e.g. the npm `AppShell` with a `nav` prop vs the copy-paste `layout/app-shell`
  // with `sideNav`; `Stack` the card-pile vs `layout/stack` the flex layout). An
  // agent that lands on the wrong page codes against the wrong prop surface, so
  // cross-link them explicitly.
  if (siblings.length > 0) {
    lines.push(
      `> ⚠ **Name collision:** more than one cascivo entry is named \`${displayNameOf(entry)}\`.`,
    )
    lines.push(`> This page documents \`${entry.name}\` (${channelLabel(entry)}). Others:`)
    for (const s of siblings) {
      lines.push(`> - \`${s.name}\` — ${channelLabel(s)} — /llms/${s.name}.md`)
    }
    lines.push('')
  }

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

  // Icon catalog — generated by scripts/icons/generate.mjs (runs earlier in
  // `pnpm regen`). Tolerate its absence so a standalone llms:generate works. Pull
  // a small concept→name legend from entries whose names differ from the familiar
  // Lucide/Radix ones, so an agent doesn't guess `LayoutDashboard`/`Rocket` and miss.
  let iconCount = 0
  const iconLegend: string[] = []
  try {
    const cat = JSON.parse(readFileSync(join(OUT_DIR, 'icons.catalog.json'), 'utf8')) as {
      count: number
      icons: { pascalName: string; aliases?: string[] }[]
    }
    iconCount = cat.count
    // Curated, high-traffic concepts; show the first foreign alias for each.
    const wanted = ['Dashboard', 'Spaceship', 'Settings', 'Trash', 'Zap', 'GitBranch']
    const byName = new Map(cat.icons.map((i) => [i.pascalName, i]))
    for (const name of wanted) {
      const alias = byName.get(name)?.aliases?.[0]
      if (alias && alias.toLowerCase() !== name.toLowerCase()) iconLegend.push(`${alias}→${name}`)
    }
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
  lines.push(
    `- **Everything in ONE file (no follow-up fetches — fetch this if you can only fetch once):** ${SITE}/llms-full.txt`,
  )
  lines.push(`- Docs (per-component reference, props, live examples): ${DOCS}`)
  lines.push(`- Storybook (every variant, interactive): https://storybook.cascivo.com`)
  lines.push(`- Source (MIT): ${REPO}`)
  lines.push(`- This file: ${SITE}/llms.txt (mirrored at ${DOCS}/llms.txt)`)
  lines.push('')
  lines.push('## Machine-readable resources (AI-first)')
  lines.push('')
  lines.push(
    `- Full text bundle — this file with every component reference inlined (single fetch): ${SITE}/llms-full.txt`,
  )
  lines.push(`- Registry — index of every component (JSON): ${SITE}/registry.json`)
  lines.push(
    `- shadcn/v0-compatible registry (install with the shadcn CLI or "Open in v0"): ${SITE}/r/shadcn/registry.json`,
  )
  lines.push(`- Per-component AI docs (props, examples, a11y, tokens): ${DOCS}/llms/<name>.md`)
  lines.push(`- Page-block AI docs are namespaced: ${DOCS}/llms/block/<name>.md`)
  lines.push(
    `- A wrong/guessed name under /llms/*, /context/*, or /r/* returns HTTP 404 with a short hint`,
  )
  lines.push(
    '  body (not the HTML SPA) — trust the 404, then look up the real name in the index below.',
  )
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
  lines.push(`keywords, aliases, categories) is ${DOCS}/icons.catalog.json.`)
  lines.push('')
  lines.push(
    'Names differ from Lucide/Radix — resolve intent via the catalog `keywords` + `aliases` fields',
  )
  lines.push('rather than guessing an export name (a wrong guess is a wasted compile).')
  if (iconLegend.length > 0) {
    lines.push(`Common mappings: ${iconLegend.join(', ')}. Version-control icons exist:`)
    lines.push('`GitBranch`, `GitCommit`, `GitMerge`, `GitPullRequest`.')
  }
  lines.push('')
  lines.push('Pure-CSS glyphs (experimental): a small opt-in set of UI glyphs, rendered with')
  lines.push('`clip-path: shape()` and no SVG — color via `currentColor`, size via')
  lines.push('`--cascivo-glyph-size`, plus zero-JS state morphs via `transition: clip-path`.')
  lines.push(
    "Use `import { Glyph } from '@cascivo/icons'` with `import '@cascivo/icons/glyphs.css'`,",
  )
  lines.push('or the class form `<span class="cascivo-glyph" data-glyph="chevron-down">`. Glyphs:')
  lines.push('`chevron-{down,up,left,right}`, `x`, `check`, `plus`, `minus`, `menu`,')
  lines.push('`arrow-{right,left,up,down}`, and the `chevron-toggle` morph. Baseline-2026 only')
  lines.push('(Chrome 135+, Safari 18.4+, Firefox 148+) — painting is gated behind `@supports`;')
  lines.push('prefer the SVG icons for a wider browser floor or for print.')
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
  lines.push(
    '   CSS note: with a bundler (CSR) per-component CSS auto-includes and tree-shakes, so the',
  )
  lines.push(
    '   `@cascivo/react/styles.css` line above is optional; under Vite SSR / TanStack Start it is',
  )
  lines.push('   required (see SSR SETUP below) and ships the full sheet (~273 KB / ~37 KB gzip).')
  lines.push('')
  lines.push(
    '   Dashboards / data viz: charts are a SEPARATE install — `pnpm add @cascivo/charts`, then',
  )
  lines.push(
    "   `import { AreaChart } from '@cascivo/charts'`. `@cascivo/react` exports no charts. The code",
  )
  lines.push(
    '   editor (`@cascivo/editor`) and flow canvas (`@cascivo/flow`) are separate installs too.',
  )
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
  lines.push(
    'SSR SETUP (Vite SSR / TanStack Start / Remix / workerd — READ THIS if you server-render): the',
  )
  lines.push(
    'prebuilt package imports per-component CSS as static `.css` side-effect imports, which a bare',
  )
  lines.push(
    'server ESM loader cannot load — an unconfigured SSR build throws `Unknown file extension ".css"`',
  )
  lines.push('and silently falls back to client-only. Two required steps:')
  lines.push(
    '  1. In vite.config: `ssr: { noExternal: [/^@cascivo\\//] }` (or add the `cascivoSsr()`',
  )
  lines.push(
    '     plugin from `@cascivo/vite-plugin`) so Vite processes the CSS instead of the runtime.',
  )
  lines.push(
    '  2. Import `@cascivo/react/styles.css` once in the root route/entry (do NOT rely on the',
  )
  lines.push('     per-component imports server-side). Full recipe: USING-WITH-VITE-SSR.md.')
  lines.push(
    'Next.js App Router does NOT need this (its recipe imports the aggregate sheet in a Server',
  )
  lines.push('Component); plain Vite CSR/SPA does NOT need it either. Only Vite *SSR* runtimes do.')
  lines.push('')
  lines.push('C. shadcn CLI / v0 — install any component from the shadcn-compatible registry:')
  lines.push('')
  lines.push('```sh')
  lines.push(`npx shadcn@latest add ${SITE}/r/shadcn/button.json`)
  lines.push('```')
  lines.push('')
  lines.push(
    'Every registry item inlines its own source and lists its cascivo dependencies as absolute',
  )
  lines.push(
    `\`${SITE}/r/shadcn/<name>.json\` URLs, so the shadcn CLI resolves them transitively. To add`,
  )
  lines.push(
    'cascivo as a named registry in `components.json` (then `npx shadcn add @cascivo/<name>`):',
  )
  lines.push('')
  lines.push('```json')
  lines.push(`{ "registries": { "@cascivo": "${SITE}/r/shadcn/{name}.json" } }`)
  lines.push('```')
  lines.push('')
  lines.push(`The registry index (all items) is ${SITE}/r/shadcn/registry.json.`)
  lines.push('')
  lines.push('## CSS layer contract (follow when generating or editing CSS)')
  lines.push('')
  lines.push('cascivo styles live in cascade layers. Layer order beats selector specificity, so:')
  lines.push('')
  lines.push(
    '1. Every declaration goes inside an `@layer` block. Unlayered CSS beats all layers regardless',
  )
  lines.push('   of specificity — never emit it.')
  lines.push(
    '2. Never invent layer names. The only layers you write: your app slot (e.g. `cascivo.example`,',
  )
  lines.push(
    '   declared in your order statement) for page styles, and `@layer cascivo.override { … }` for',
  )
  lines.push('   hotfixes/one-off overrides — it beats everything cascivo ships.')
  lines.push(
    '3. Never nest layers deeper than the shipped `cascivo.blocks.<name>` pattern. For sub-elements',
  )
  lines.push(
    '   (a badge in a card, a dot in a badge) use native CSS nesting inside one layer block, not new',
  )
  lines.push('   sublayers.')
  lines.push(
    '4. Third-party CSS: `@import url(…) layer(vendor);` with `vendor` declared before the cascivo',
  )
  lines.push('   layers. Never import vendor CSS from JavaScript.')
  lines.push('5. Style with `--cascivo-*` tokens, not raw values.')
  lines.push('')
  lines.push('Canonical order (lowest → highest priority):')
  lines.push(
    '`@layer vendor, cascivo.reset, cascivo.base, cascivo.tokens, cascivo.component, cascivo.theme, cascivo.blocks, cascivo.override;`',
  )
  lines.push(`Full recipe: ${REPO}/blob/main/docs/CSS-LAYERS-PITFALL.md.`)
  lines.push('')
  lines.push('## Reactivity & state (signals, not React hooks)')
  lines.push('')
  lines.push(
    '**Consuming components requires no signals.** Pass plain props, use `useState` in YOUR own code,',
  )
  lines.push(
    'and render `<Button onClick={…}>` / `<Modal open={…}>` like any React library — you never need',
  )
  lines.push(
    '`useSignals()` unless your own component body reads a `signal.value` during render. Signals are',
  )
  lines.push('how cascivo works INTERNALLY; they are not a precondition for using it.')
  lines.push('')
  lines.push(
    'The rules below apply when you OWN reactive state — authoring a cascivo-style component, or opting',
  )
  lines.push(
    "into cascivo's reactive store. There, prefer signals over React hooks: mixing the two (mirroring a",
  )
  lines.push(
    'signal into `useState`, or vice-versa) causes the "state fights the DOM / toggle does nothing"',
  )
  lines.push(
    'bugs. And in any app WITHOUT the Babel signals transform (every consumer app), a component that',
  )
  lines.push(
    'reads `signal.value` in render MUST call `useSignals()` (from `@cascivo/core`) as its first',
  )
  lines.push('statement, or it never re-renders. When you do own reactive state, use these:')
  lines.push('')
  lines.push(
    '- Local state -> `useSignal(initial)`; derived -> `useComputed(fn)`. The signal IS the state.',
  )
  lines.push(
    '- Controlled/uncontrolled prop bridged to a signal -> `useControllableSignal({ value, defaultValue, onChange })`.',
  )
  lines.push('- Side effects (DOM, listeners) -> `useSignalEffect(fn)`, never `useEffect`.')
  lines.push(
    '- Shared/app-wide state -> a module-level signal, imported anywhere. No React context needed.',
  )
  lines.push(
    '- Per-route / per-tenant effect disposal -> `useScope()` / `createScope()` (disposes on unmount; prevents signal leaks across navigation).',
  )
  lines.push('- Genuine internal state machine -> `createMachine` / `useMachine`.')
  lines.push(
    '- Forms -> `createForm` / `useForm` / `<Form>` / `field()` (`@cascivo/react`): a signal-backed store with sync/async + Standard Schema (zod/valibot) validation and optional `validateOnChange` — keystroke validation, zero re-renders.',
  )
  lines.push(
    '- Theming -> `<ThemeProvider>` + `useTheme()` / `setTheme()` + `themePreloadScript()` (`@cascivo/react`): persists the choice and drives `data-theme`, SSR no-FOUC. Never write a `useEffect` that toggles a `.dark` class.',
  )
  lines.push(
    "- Token names in TypeScript -> `import type { CascivoToken, CascivoColorToken } from '@cascivo/tokens/tokens'` (generated union of every `--cascivo-*` property — no CSS-file lookup).",
  )
  lines.push('')
  lines.push(
    `Full behavior/headless catalog: ${REPO}/blob/main/docs/HEADLESS.md. Enterprise friction -> primitive map: ${REPO}/blob/main/docs/ENTERPRISE-READINESS.md.`,
  )
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
  lines.push(`- Reactivity & headless behavior primitives: ${REPO}/blob/main/docs/HEADLESS.md`)
  lines.push(
    `- Enterprise readiness (friction -> primitive map: state, layout, theming, forms, tokens): ${REPO}/blob/main/docs/ENTERPRISE-READINESS.md`,
  )
  lines.push(`- Theming & branding: ${REPO}/blob/main/docs/THEMING.md`)
  lines.push(`- Using cascivo with Preact: ${REPO}/blob/main/docs/USING-WITH-PREACT.md`)
  lines.push(
    `- Using cascivo with Next.js (App Router / RSC): ${REPO}/blob/main/docs/USING-WITH-NEXTJS.md`,
  )
  lines.push(
    `- Using cascivo with Vite SSR / TanStack Start: ${REPO}/blob/main/docs/USING-WITH-VITE-SSR.md`,
  )
  lines.push(
    `- Using cascivo with Tailwind v4 (@layer order + dark bridge): ${REPO}/blob/main/docs/USING-WITH-TAILWIND.md`,
  )
  lines.push(`- Compatibility & support matrix: ${REPO}/blob/main/docs/COMPATIBILITY.md`)
  lines.push(`- Migrating from shadcn/ui: ${REPO}/blob/main/docs/MIGRATING-FROM-SHADCN.md`)
  lines.push(`- Token reference: ${REPO}/blob/main/docs/TOKENS.md`)
  lines.push('')
  lines.push('## Reference apps (runnable, in-repo — copy these setups)')
  lines.push('')
  lines.push(`- Vite + React (CSR/SPA): ${REPO}/tree/main/apps/examples/react-vite`)
  lines.push(
    `- Vite SSR (TanStack Start / Remix / workerd — server-renders through the built dist with \`cascivoSsr()\`): ${REPO}/tree/main/apps/examples/react-vite-ssr`,
  )
  lines.push(`- Next.js App Router (RSC): ${REPO}/tree/main/apps/examples/react-next`)
  lines.push('')
  lines.push('## Frameworks & browsers (summary; full matrix in COMPATIBILITY.md)')
  lines.push('')
  lines.push(
    '- React 18/19, Next.js App Router (RSC), Vite (CSR), Astro islands, Preact 10 (preact/compat — verified).',
  )
  lines.push(
    '- Vite SSR / TanStack Start / Remix / workerd: supported, but add `ssr.noExternal: [/^@cascivo\\//]`',
  )
  lines.push(
    '  (or the `cascivoSsr()` plugin) + import `@cascivo/react/styles.css` once. Without it the server',
  )
  lines.push('  loader throws `Unknown file extension ".css"`. See USING-WITH-VITE-SSR.md.')
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
  lines.push(
    '- `search_icons` — resolve an icon by intent/foreign name (LayoutDashboard→Dashboard)',
  )
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
  lines.push(
    'These constrain code you write INSIDE a component you author or copy-paste-and-edit — not the app',
  )
  lines.push('code that merely renders cascivo components (that code uses React normally).')
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

  // Break the count out by distribution channel so the total isn't read as "all of
  // these are @cascivo/react exports" — charts/editor/flow are separate installs and
  // blocks are copy-paste only (finding #1 from the TanStack dashboard adopter report).
  const separateInstalls = new Map<string, number>()
  for (const e of sorted) {
    if (e.install && e.install !== '@cascivo/react') {
      separateInstalls.set(e.install, (separateInstalls.get(e.install) ?? 0) + 1)
    }
  }
  const breakdown = [...separateInstalls.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([pkg, n]) => `${n} in ${pkg}`)
    .join(', ')
  lines.push(`## Component index (${sorted.length} entries)`)
  lines.push('')
  if (breakdown) {
    lines.push(
      `Not all ship in \`@cascivo/react\`: ${breakdown} — those are separate installs (see Quick Setup). Blocks are copy-paste only. Each entry below is tagged with its channel.`,
    )
    lines.push('')
  }
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

/**
 * llms-full.txt — the llms.txt overview concatenated with every per-component
 * reference inlined, so an agent that can only make a single successful fetch
 * (the common case for v0 / hosted tools, and the failure mode when the docs
 * host challenges follow-up requests) gets the whole library in one document.
 */
function generateLlmsFullTxt(
  registry: Registry,
  entries: RegistryEntry[],
  llmsTxt: string,
  markdownByName: Map<string, string>,
): string {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  const parts: string[] = [llmsTxt.trimEnd(), '']
  parts.push('---')
  parts.push('')
  parts.push('# Full component reference (inlined)')
  parts.push('')
  parts.push(
    'Every entry below is the same content as the per-component `llms/<name>.md` files, inlined',
  )
  parts.push('here so no additional fetches are required.')
  parts.push('')
  for (const entry of sorted) {
    const md = markdownByName.get(entry.name)
    if (!md) continue
    parts.push('---')
    parts.push('')
    parts.push(md.trimEnd())
    parts.push('')
  }
  parts.push(`_Generated: ${registry.generatedAt} from registry v${registry.version}_`)
  parts.push('')
  return parts.join('\n')
}

function main() {
  const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  // Page blocks live in a separate `blocks` array; fold them into entries so they
  // get per-entry `.md`, an index listing, and an intent summary like components.
  const entries = [...registry.components, ...blockEntries(registry)]

  mkdirSync(LLMS_DIR, { recursive: true })

  // Group entries by display name so pages for same-named entries cross-link.
  const byDisplayName = new Map<string, RegistryEntry[]>()
  for (const entry of entries) {
    const key = displayNameOf(entry)
    const group = byDisplayName.get(key) ?? []
    group.push(entry)
    byDisplayName.set(key, group)
  }

  // Generate per-component markdown
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  const markdownByName = new Map<string, string>()
  for (const entry of sorted) {
    const siblings = (byDisplayName.get(displayNameOf(entry)) ?? []).filter((e) => e !== entry)
    const md = componentMarkdown(entry, siblings)
    markdownByName.set(entry.name, md)
    const outPath = join(LLMS_DIR, `${entry.name}.md`)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, md, 'utf8')
  }

  // Generate llms.txt. It uses absolute URLs throughout. The unified site serves
  // it from cascivo.com/llms.txt.
  const llmsTxt = generateLlmsTxt(registry, entries)
  writeFileSync(join(OUT_DIR, 'llms.txt'), llmsTxt, 'utf8')

  // Generate llms-full.txt — one self-contained file (overview + every reference).
  const llmsFullTxt = generateLlmsFullTxt(registry, entries, llmsTxt, markdownByName)
  writeFileSync(join(OUT_DIR, 'llms-full.txt'), llmsFullTxt, 'utf8')

  console.log(`Generated llms.txt, llms-full.txt + ${sorted.length} component markdown files`)
}

main()
