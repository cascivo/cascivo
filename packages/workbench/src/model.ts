/** The fields of a copied `<name>.meta.ts` the workbench reads. */
export interface Manifest {
  name: string
  description: string
  props: { name: string; type: string; required: boolean; default?: string; description?: string }[]
  tokens: string[]
  examples: { title: string; code: string; description?: string }[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

/**
 * A manifest as the workbench uses it, or `null` when the export is not one. The file is the
 * project's own, edited by hand, and a block's or a section's manifest has a different shape:
 * a missing list becomes an empty one, and a malformed entry is dropped, not rendered.
 */
export function parseManifest(raw: unknown): Manifest | null {
  if (!isRecord(raw)) return null
  const name = str(raw.name)
  if (!name) return null
  const list = (v: unknown) => (Array.isArray(v) ? v.filter(isRecord) : [])
  return {
    name,
    description: str(raw.description) ?? '',
    props: list(raw.props).flatMap((p) => {
      const propName = str(p.name)
      if (!propName) return []
      const def = str(p.default)
      const description = str(p.description)
      return [
        {
          name: propName,
          type: str(p.type) ?? 'unknown',
          required: p.required === true,
          ...(def !== undefined ? { default: def } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      ]
    }),
    tokens: Array.isArray(raw.tokens) ? raw.tokens.filter((t) => typeof t === 'string') : [],
    examples: list(raw.examples).map((e, i) => {
      const description = str(e.description)
      return {
        title: str(e.title) ?? `Example ${i + 1}`,
        code: str(e.code) ?? '',
        ...(description !== undefined ? { description } : {}),
      }
    }),
  }
}

/** The twelve first-party themes, as `data-theme` values. */
export const THEMES = [
  'light',
  'dark',
  'warm',
  'flat',
  'minimal',
  'midnight',
  'pastel',
  'brutalist',
  'corporate',
  'terminal',
  'cyberpunk',
  'arcade',
] as const

/** cascivo's breakpoint scale, plus the narrowest phone the mobile sweep checks. */
export const VIEWPORTS = [
  { label: 'Fill', width: null },
  { label: '320 — small phone', width: 320 },
  { label: '480 — sm', width: 480 },
  { label: '640 — md', width: 640 },
  { label: '1024 — lg', width: 1024 },
  { label: '1280 — xl', width: 1280 },
] as const

/**
 * What an agent needs to use this component correctly, and nothing else: the props it takes
 * and the example being looked at. The whole manifest is several times longer, and an agent
 * pays for every byte of context on every turn.
 */
export function agentContext(meta: Manifest, example: number): string {
  const props = meta.props.map((p) => {
    const flags = [p.required ? 'required' : null, p.default ? `default ${p.default}` : null]
      .filter(Boolean)
      .join(', ')
    return `- ${p.name}: ${p.type}${flags ? ` (${flags})` : ''}${p.description ? ` — ${p.description}` : ''}`
  })
  const chosen = meta.examples[example]
  return [
    `# ${meta.name}`,
    meta.description,
    '',
    '## Props',
    ...(props.length > 0 ? props : ['(none)']),
    ...(chosen ? ['', `## Example: ${chosen.title}`, '```tsx', chosen.code, '```'] : []),
    '',
  ].join('\n')
}

/** A control the Controls panel can draw for a prop, from its manifest type. */
export type Control =
  | { name: string; kind: 'select'; options: string[] }
  | { name: string; kind: 'boolean' | 'text' | 'number' }

/**
 * The props whose manifest type is simple enough to edit: a union of string literals, or a
 * plain `boolean`, `string` or `number`. Anything else (a node, a callback, an object) is left
 * to the example's own code.
 */
export function controlsFor(props: Manifest['props']): Control[] {
  return props.flatMap((p): Control[] => {
    const type = p.type.trim()
    if (type === 'boolean') return [{ name: p.name, kind: 'boolean' }]
    if (type === 'string') return [{ name: p.name, kind: 'text' }]
    if (type === 'number') return [{ name: p.name, kind: 'number' }]
    const members = type.split('|').map((m) => m.trim())
    if (members.length > 1 && members.every((m) => /^'[^']*'$/.test(m))) {
      return [{ name: p.name, kind: 'select', options: members.map((m) => m.slice(1, -1)) }]
    }
    return []
  })
}
