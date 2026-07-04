#!/usr/bin/env node
/**
 * Context bundle generator.
 *
 * Reads registry.json and writes:
 *   apps/site/public/context.json          — component index with intent
 *   apps/site/public/context/<name>.md     — per-component agent-readable pages
 *
 * Run with: `pnpm context:generate`
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnum } from '../../packages/mcp/src/grammar.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PropMeta {
  name: string
  type: string
  required?: boolean
  default?: string
  description?: string
}

export interface ExampleMeta {
  title: string
  code: string
  description?: string
}

export interface AntiPattern {
  bad: string
  good: string
  why: string
}

export interface RelatedComponent {
  name: string
  relationship: string
  reason: string
}

export interface FlexibilityRule {
  area: string
  level: string
  note: string
}

export interface ComponentIntent {
  whenToUse?: string[]
  whenNotToUse?: string[]
  antiPatterns?: AntiPattern[]
  related?: RelatedComponent[]
  a11yRationale?: string
  flexibility?: FlexibilityRule[]
}

export interface ComponentMeta {
  name: string
  description: string
  category: string
  states?: string[]
  variants?: string[]
  sizes?: string[]
  props?: PropMeta[]
  tokens?: string[]
  accessibility?: { role: string; wcag: string; keyboard?: string[] }
  examples?: ExampleMeta[]
  dependencies?: string[]
  tags?: string[]
  intent?: ComponentIntent | null
}

export interface RegistryEntry {
  name: string
  type: string
  description: string
  category: string
  version?: string
  files?: string[]
  dependencies?: string[]
  tags?: string[]
  meta?: ComponentMeta
}

export interface Registry {
  version: string
  generatedAt: string
  components: RegistryEntry[]
}

// ---------------------------------------------------------------------------
// context.json
// ---------------------------------------------------------------------------

export const AUTHORING_RULES = [
  'Signals only: useSignal, useComputed, useSignalEffect from @cascivo/core',
  'No useState, useEffect, useContext, useLayoutEffect, useReducer in components',
  'DOM side effects via useSignalEffect, not useEffect',
  'useRef only for DOM element references',
  'CSS custom properties only — no Tailwind, no inline styles, no CSS-in-JS',
  'Visual states (hover/focus/active) via CSS pseudo-classes — not JS',
  'data-state attributes only for states CSS cannot express (e.g. loading, error)',
  'FSM (useMachine) only when the component itself drives transitions',
  'CSS logical properties throughout (RTL-safe)',
  'User-visible strings via @cascivo/i18n — no hardcoded English fallbacks',
  'WCAG 2.1 AA minimum — keyboard navigable, screen-reader tested',
]

/**
 * Structured form of a prop's TS type string, so tools that cannot re-parse
 * TS unions (the raw `type` stays alongside) can still validate values.
 */
export interface PropSchema {
  kind: 'enum' | 'boolean' | 'number' | 'string' | 'function' | 'node' | 'other'
  values?: string[]
}

export function propSchema(type: string): PropSchema {
  const values = parseEnum(type)
  if (values) return { kind: 'enum', values }
  const t = type.trim()
  if (t === 'boolean') return { kind: 'boolean' }
  if (t === 'number') return { kind: 'number' }
  if (t === 'string') return { kind: 'string' }
  if (t.includes('=>')) return { kind: 'function' }
  if (/ReactNode|ReactElement|JSX\./.test(t)) return { kind: 'node' }
  return { kind: 'other' }
}

export interface ContextIndexEntry {
  name: string
  category: string
  description: string
  intent: ComponentIntent | null
  props: (PropMeta & { schema: PropSchema })[]
  contextUrl: string
  /** Copy-pasteable system-prompt snippet that pins an LLM to this component. */
  aiPrompt: string
}

export interface SpecRef {
  id: string
  title: string
  path: string
}

export interface ContextIndex {
  generatedAt: string
  tagline: string
  authoringRules: string[]
  tokenCatalogUrl: string
  variantMatrixUrl: string
  specs: SpecRef[]
  boundaries: unknown
  exceptions: unknown
  components: ContextIndexEntry[]
}

export interface ContextExtras {
  specs?: SpecRef[]
  boundaries?: unknown
  exceptions?: unknown
}

export function buildContextIndex(
  registry: Registry,
  entries: RegistryEntry[],
  extras: ContextExtras = {},
): ContextIndex {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    tagline: 'The CSS-native, signal-driven, AI-first React design system',
    authoringRules: AUTHORING_RULES,
    tokenCatalogUrl: '/tokens.catalog.json',
    variantMatrixUrl: '/tokens.variants.json',
    specs: extras.specs ?? [],
    boundaries: extras.boundaries ?? null,
    exceptions: extras.exceptions ?? null,
    components: sorted.map((entry) => ({
      name: entry.meta?.name ?? entry.name,
      category: entry.category,
      description: entry.description,
      intent: entry.meta?.intent ?? null,
      props: (entry.meta?.props ?? []).map((p) => ({ ...p, schema: propSchema(p.type) })),
      contextUrl: `/context/${entry.name}.md`,
      aiPrompt: buildContextPrompt(entry),
    })),
  }
}

// ---------------------------------------------------------------------------
// AI context prompt — copy-pasteable system-prompt snippet
// ---------------------------------------------------------------------------

/**
 * Build a tailored system-prompt snippet for one component. Dropping this into
 * an LLM's context bar pins the model to this component's tokens, container
 * breakpoints, and the design system's CSS/signal rules — eliminating the
 * prompt-engineering guesswork for developers adapting the library.
 */
export function buildContextPrompt(entry: RegistryEntry): string {
  const meta = entry.meta
  const name = meta?.name ?? entry.name
  const tokens = meta?.tokens ?? []
  const a11y = meta?.accessibility
  const strict = (meta?.intent?.flexibility ?? []).filter((f) => f.level === 'strict')
  const flexible = (meta?.intent?.flexibility ?? []).filter((f) => f.level === 'flexible')

  const lines: string[] = []
  lines.push(
    `I am modifying the cascivo ${name} component (${entry.category}). ${entry.description}`,
  )
  lines.push('')
  lines.push('Architecture constraints — follow exactly:')
  lines.push(
    '- Signals only (useSignal/useComputed/useSignalEffect from @cascivo/core). Never useState/useEffect/useContext/useReducer.',
  )
  lines.push(
    '- Style only through --cascivo-* custom properties. No Tailwind, no inline styles, no CSS-in-JS.',
  )
  lines.push(
    '- Responsive via @container queries on the canonical scale (30rem/40rem/64rem/80rem). Do not use global viewport @media breakpoints.',
  )
  lines.push('- Visual states (hover/focus/active/disabled) via CSS pseudo-classes, not JS.')
  lines.push('- CSS logical properties only (RTL-safe).')
  lines.push('')
  lines.push(
    `${name} is strictly bound to these tokens — use only these, do not invent token names:`,
  )
  lines.push(`  ${tokens.length > 0 ? tokens.join(', ') : 'none declared'}`)
  if (a11y) {
    const kb =
      a11y.keyboard && a11y.keyboard.length > 0 ? `, keyboard: ${a11y.keyboard.join('/')}` : ''
    lines.push('')
    lines.push(`Accessibility: role "${a11y.role}", WCAG ${a11y.wcag}${kb}. Keep it AA.`)
  }
  if (strict.length > 0) {
    lines.push('')
    lines.push(`Do not change (strict): ${strict.map((f) => `${f.area} — ${f.note}`).join('; ')}`)
  }
  if (flexible.length > 0) {
    lines.push(`Flexible: ${flexible.map((f) => f.area).join(', ')}.`)
  }
  lines.push('')
  lines.push('Do not invent props, tokens, or global viewport media queries.')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Per-component markdown
// ---------------------------------------------------------------------------

export function buildComponentMarkdown(entry: RegistryEntry): string {
  const meta = entry.meta
  const intent = meta?.intent ?? null
  const displayName = meta?.name ?? entry.name
  const lines: string[] = []

  lines.push(`# ${displayName}`)
  lines.push('')
  lines.push(`**Category:** ${entry.category}  `)
  lines.push(`**Description:** ${entry.description}`)
  lines.push('')

  if (!intent) {
    lines.push('> _Intent not yet documented for this component._')
    lines.push('')
  } else {
    if (intent.whenToUse && intent.whenToUse.length > 0) {
      lines.push('## When to use')
      lines.push('')
      for (const item of intent.whenToUse) {
        lines.push(`- ${item}`)
      }
      lines.push('')
    }

    if (intent.whenNotToUse && intent.whenNotToUse.length > 0) {
      lines.push('## When NOT to use')
      lines.push('')
      for (const item of intent.whenNotToUse) {
        lines.push(`- ${item}`)
      }
      lines.push('')
    }

    if (intent.antiPatterns && intent.antiPatterns.length > 0) {
      lines.push('## Anti-patterns')
      lines.push('')
      for (const ap of intent.antiPatterns) {
        lines.push(`### ${ap.why}`)
        lines.push('')
        lines.push(`**Bad:** \`${ap.bad}\`  `)
        lines.push(`**Good:** \`${ap.good}\`  `)
        lines.push(`**Why:** ${ap.why}`)
        lines.push('')
      }
    }

    if (intent.related && intent.related.length > 0) {
      lines.push('## Related components')
      lines.push('')
      for (const rel of intent.related) {
        lines.push(`- **${rel.name}** (${rel.relationship}): ${rel.reason}`)
      }
      lines.push('')
    }

    if (intent.a11yRationale) {
      lines.push('## Accessibility rationale')
      lines.push('')
      lines.push(intent.a11yRationale)
      lines.push('')
    }
  }

  if (meta?.props && meta.props.length > 0) {
    lines.push('## Props')
    lines.push('')
    lines.push('| Name | Type | Required | Default | Description |')
    lines.push('|------|------|----------|---------|-------------|')
    // Escape pipes so union types don't spawn extra table columns (GFM treats a
    // bare `|` as a cell delimiter even inside a code span).
    const esc = (s: string) => s.replace(/\|/g, '\\|')
    for (const p of meta.props) {
      const def = p.default !== undefined ? esc(String(p.default)) : '—'
      const desc = esc(p.description ?? '—')
      lines.push(
        `| \`${p.name}\` | \`${esc(p.type)}\` | ${p.required ? 'Yes' : 'No'} | ${def} | ${desc} |`,
      )
    }
    lines.push('')
  }

  if (meta?.tokens && meta.tokens.length > 0) {
    lines.push('## Tokens')
    lines.push('')
    for (const token of meta.tokens) {
      lines.push(`- \`${token}\``)
    }
    lines.push('')
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
      lines.push('```jsx')
      lines.push(ex.code)
      lines.push('```')
      lines.push('')
    }
  }

  if (intent?.flexibility && intent.flexibility.length > 0) {
    lines.push('## Boundaries')
    lines.push('')
    lines.push('| Area | Level | Note |')
    lines.push('|------|-------|------|')
    const escCell = (s: string) => String(s).replace(/\|/g, '\\|')
    for (const f of intent.flexibility) {
      lines.push(`| ${escCell(f.area)} | ${escCell(f.level)} | ${escCell(f.note)} |`)
    }
    lines.push('')
  }

  lines.push('## AI context prompt')
  lines.push('')
  lines.push('Copy this into an LLM context bar before editing this component:')
  lines.push('')
  lines.push('```text')
  lines.push(buildContextPrompt(entry))
  lines.push('```')
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_DIR = join(ROOT, 'apps', 'site', 'public')
const CONTEXT_DIR = join(OUT_DIR, 'context')

/** Read a generated JSON artifact; returns null if it doesn't exist yet. */
function readJsonIfExists(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function main() {
  const registry: Registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  // Every registry entry gets context — an agent choosing between a chart, a
  // layout, and a component needs intent for all of them, not just
  // type:"component" (which used to leave 60+ entries invisible to
  // select_component/get_context).
  const entries = registry.components

  mkdirSync(CONTEXT_DIR, { recursive: true })

  const specsFile = readJsonIfExists(join(OUT_DIR, 'specs.json'))
  const boundariesFile = readJsonIfExists(join(OUT_DIR, 'boundaries.json'))
  const exceptionsFile = readJsonIfExists(join(OUT_DIR, 'exceptions.json'))

  const specs = Array.isArray(specsFile?.specs)
    ? (specsFile.specs as Array<{ id: string; title: string; path: string }>).map((s) => ({
        id: s.id,
        title: s.title,
        path: s.path,
      }))
    : []

  const index = buildContextIndex(registry, entries, {
    specs,
    boundaries: boundariesFile ?? null,
    exceptions: exceptionsFile ?? null,
  })
  writeFileSync(join(OUT_DIR, 'context.json'), JSON.stringify(index, null, 2) + '\n')
  console.log(`Wrote context.json with ${index.components.length} components`)

  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of sorted) {
    const md = buildComponentMarkdown(entry)
    // Prefixed names (layout/app-shell, chart/bar-chart, …) nest one level.
    const outPath = join(CONTEXT_DIR, `${entry.name}.md`)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, md)
  }
  console.log(`Wrote ${sorted.length} files to context/`)

  // Compact { <component>: aiPrompt } map for the Storybook "Copy AI context"
  // button (served from apps/storybook/public).
  const prompts: Record<string, string> = {}
  for (const entry of sorted) prompts[entry.name] = buildContextPrompt(entry)
  const SB_PUBLIC = join(ROOT, 'apps', 'storybook', 'public')
  mkdirSync(SB_PUBLIC, { recursive: true })
  writeFileSync(join(SB_PUBLIC, 'context-prompts.json'), JSON.stringify(prompts, null, 2) + '\n')
  console.log(`Wrote context-prompts.json with ${Object.keys(prompts).length} prompts`)
}

// Only run when executed directly, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
