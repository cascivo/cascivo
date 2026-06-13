#!/usr/bin/env node
/**
 * Context bundle generator.
 *
 * Reads registry.json and writes:
 *   apps/docs/public/context.json          — component index with intent
 *   apps/docs/public/context/<name>.md     — per-component agent-readable pages
 *
 * Run with: `pnpm context:generate`
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  'Signals only: useSignal, useComputed, useSignalEffect from @cascade-ui/core',
  'No useState, useEffect, useContext, useLayoutEffect, useReducer in components',
  'DOM side effects via useSignalEffect, not useEffect',
  'useRef only for DOM element references',
  'CSS custom properties only — no Tailwind, no inline styles, no CSS-in-JS',
  'Visual states (hover/focus/active) via CSS pseudo-classes — not JS',
  'data-state attributes only for states CSS cannot express (e.g. loading, error)',
  'FSM (useMachine) only when the component itself drives transitions',
  'CSS logical properties throughout (RTL-safe)',
  'User-visible strings via @cascade-ui/i18n — no hardcoded English fallbacks',
  'WCAG 2.1 AA minimum — keyboard navigable, screen-reader tested',
]

export interface ContextIndexEntry {
  name: string
  category: string
  description: string
  intent: ComponentIntent | null
  contextUrl: string
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
    specs: extras.specs ?? [],
    boundaries: extras.boundaries ?? null,
    exceptions: extras.exceptions ?? null,
    components: sorted.map((entry) => ({
      name: entry.meta?.name ?? entry.name,
      category: entry.category,
      description: entry.description,
      intent: entry.meta?.intent ?? null,
      contextUrl: `/context/${entry.name}.md`,
    })),
  }
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
    for (const p of meta.props) {
      const def = p.default !== undefined ? p.default : '—'
      const desc = p.description ?? '—'
      lines.push(
        `| \`${p.name}\` | \`${p.type}\` | ${p.required ? 'Yes' : 'No'} | ${def} | ${desc} |`,
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
    for (const f of intent.flexibility) {
      lines.push(`| ${f.area} | ${f.level} | ${f.note} |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(ROOT, 'registry.json')
const OUT_DIR = join(ROOT, 'apps', 'docs', 'public')
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
  const entries = registry.components.filter((c) => c.type === 'component')

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
    writeFileSync(join(CONTEXT_DIR, `${entry.name}.md`), md)
  }
  console.log(`Wrote ${sorted.length} files to context/`)
}

// Only run when executed directly, not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
