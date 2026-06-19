// Library-derived bound vocabulary (v40 T1).
//
// OpenUI's anti-hallucination mechanism is a system prompt generated from the
// component library so a model can only emit registered components/props. This
// module derives that bound vocabulary from the cascade manifests
// (component.meta.ts → registry.json): per component → its props (name, type,
// allowed enum values, required) plus variants/sizes. Because it is *derived*,
// it can never drift from the components (grammar.test.ts asserts every name it
// references exists in the registry).

import type { Registry } from './registry.js'

export interface GrammarProp {
  name: string
  required: boolean
  /** Raw TypeScript type string from the manifest. */
  type: string
  /** Allowed values, when `type` is a string-literal union (e.g. `'sm' | 'md'`). */
  enum?: string[]
}

export interface GrammarComponent {
  name: string
  category: string
  props: GrammarProp[]
  variants: string[]
  sizes: string[]
}

export interface ViewGrammar {
  components: GrammarComponent[]
}

/**
 * Parse a string-literal union type (`'a' | 'b' | "c"`) into its allowed
 * values. Returns `undefined` for any non-enum type (primitives, functions,
 * named types, object shapes) so the grammar only constrains what it can.
 */
export function parseEnum(type: string): string[] | undefined {
  const branches = type
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (branches.length === 0) return undefined
  const values: string[] = []
  for (const branch of branches) {
    const quoted = branch.match(/^['"](.+)['"]$/)
    if (!quoted?.[1]) return undefined
    values.push(quoted[1])
  }
  return values
}

/**
 * Build the bound-vocabulary descriptor from the registry, optionally scoped to
 * a subset of component names (case-insensitive). Output is deterministic
 * (components and props sorted by name) for reproducible prompts and tests.
 */
// Preference when two registry entries share a meta.name (e.g. a `component`
// and a `layout` both named "AppShell"): the node-usable component wins.
const TYPE_RANK: Record<string, number> = {
  component: 0,
  block: 1,
  chart: 2,
  section: 3,
  layout: 4,
}

export function buildGrammar(registry: Registry, subset?: string[]): ViewGrammar {
  const wanted = subset && subset.length > 0 ? new Set(subset.map((n) => n.toLowerCase())) : null

  // Dedupe by meta.name, keeping the highest-ranked (node-usable) entry.
  const canonical = new Map<string, (typeof registry.components)[number]>()
  for (const c of registry.components) {
    const key = c.meta.name.toLowerCase()
    const current = canonical.get(key)
    if (!current || (TYPE_RANK[c.type ?? ''] ?? 9) < (TYPE_RANK[current.type ?? ''] ?? 9)) {
      canonical.set(key, c)
    }
  }

  const components: GrammarComponent[] = [...canonical.values()]
    .filter(
      (c) => !wanted || wanted.has(c.meta.name.toLowerCase()) || wanted.has(c.name.toLowerCase()),
    )
    .map((c) => {
      const props: GrammarProp[] = (c.meta.props ?? [])
        .map((p) => {
          const values = parseEnum(p.type)
          return {
            name: p.name,
            required: p.required === true,
            type: p.type,
            ...(values ? { enum: values } : {}),
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
      return {
        name: c.meta.name,
        category: c.category,
        props,
        variants: c.meta.variants ?? [],
        sizes: c.meta.sizes ?? [],
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return { components }
}

/** Render one prop as `name`, `name*` (required), with enum choices or its type. */
function formatProp(prop: GrammarProp): string {
  const mark = prop.required ? '*' : ''
  const value = prop.enum ? prop.enum.join('|') : prop.type
  return `${prop.name}${mark}: ${value}`
}

/**
 * Render the grammar as a compact, model-friendly table: one line per
 * component. Terser than verbose JSON; a `*` marks a required prop.
 *
 *   Badge(size: sm|md, variant: default|secondary|success|warning|destructive|outline)
 */
export function formatGrammar(grammar: ViewGrammar): string {
  return grammar.components
    .map((c) => `${c.name}(${c.props.map(formatProp).join(', ')})`)
    .join('\n')
}
