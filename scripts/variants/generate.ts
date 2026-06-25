/**
 * Variant matrix generator.
 *
 * Builds a deterministic map from design intent (a semantic colour role + a
 * state slot, e.g. "accent" + "hover") to the exact token name, and resolves
 * every semantic / component token to a concrete value in EACH first-party
 * theme. Writes apps/site/public/tokens.variants.json.
 *
 * The token catalog (tokens.catalog.json) already gives agents the closed set
 * of token names and their light-theme value. The variant matrix answers the
 * follow-up question an agent otherwise has to compute in its head:
 *
 *   "What is the warm theme's accent-hover value?"  → look up byTheme.warm
 *   "Which token is the active state of primary?"    → families.primary.active
 *
 * With this, an agent can write flawless inline structural adjustments without
 * guessing how the layered theme CSS resolves.
 *
 * Run with: `pnpm variants:generate`
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDeclarations } from '../catalog/parse-tokens.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')

// Theme files that are not selectable themes (no [data-theme] block of their own).
const NON_THEME_FILES = new Set(['base.css', 'all.css'])

// Recognised state slots, longest-first so "subtle" wins before a hypothetical
// shorter overlap. A token whose trailing segment matches one of these is a
// state variant of the role that precedes it.
const SLOTS = [
  'foreground',
  'content',
  'subtle',
  'muted',
  'active',
  'hover',
  'disabled',
  'fg',
] as const

export interface VariantToken {
  name: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  /** Semantic colour role (e.g. "accent"), only set for the `color` group. */
  role?: string
  /** State slot within the role (e.g. "hover", or "base"), only for `color`. */
  slot?: string
  /** Resolved concrete value per theme. `null` when the token is undefined there. */
  byTheme: Record<string, string | null>
}

export interface VariantMatrix {
  generatedFrom: string[]
  generatedAt: string
  themes: string[]
  /** role → slot → token name. The deterministic intent→token map. */
  families: Record<string, Record<string, string>>
  tokens: VariantToken[]
}

/** Classify a token's layer the same way the token catalog does. */
function classifyLayer(name: string): 'primitive' | 'semantic' | 'component' {
  const body = name.slice('--cascivo-'.length)
  const segments = body.split('-')
  const COMPONENT = new Set([
    'button',
    'input',
    'card',
    'badge',
    'modal',
    'ring',
    'shell',
    'control',
    'focus',
    'overlay',
  ])
  for (const seg of segments) if (COMPONENT.has(seg)) return 'component'
  const PRIMITIVE = new Set([
    'gray',
    'blue',
    'green',
    'red',
    'orange',
    'yellow',
    'warm',
    'space',
    'radius',
    'shadow',
    'text',
    'font',
    'leading',
    'tracking',
    'chart',
    'duration',
    'ease',
    'z',
  ])
  const group = segments[0]!
  if (PRIMITIVE.has(group)) {
    const last = segments[segments.length - 1]!
    if (/^\d+$/.test(last)) return 'primitive'
    if (['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full', 'none'].includes(last))
      return 'primitive'
    if (group === 'font' && (last === 'sans' || last === 'mono')) return 'primitive'
    if (group === 'ease') return 'primitive'
  }
  return 'semantic'
}

function extractGroup(name: string): string {
  const body = name.slice('--cascivo-'.length)
  const dash = body.indexOf('-')
  return dash === -1 ? body : body.slice(0, dash)
}

/** Split a `--cascivo-color-*` token into its role and state slot. */
export function splitRole(name: string): { role: string; slot: string } | null {
  const prefix = '--cascivo-color-'
  if (!name.startsWith(prefix)) return null
  const body = name.slice(prefix.length) // e.g. "accent-hover", "accent", "text-on-accent"
  for (const slot of SLOTS) {
    if (body.endsWith(`-${slot}`)) {
      return { role: body.slice(0, -(slot.length + 1)), slot }
    }
  }
  return { role: body, slot: 'base' }
}

/**
 * Resolve a token's value within one theme by following var() chains through
 * the combined (index + theme) declaration map. calc() and complex values that
 * embed var() (color-mix, multi-token shadows) are kept verbatim, matching the
 * token catalog's behaviour.
 */
export function resolveInTheme(
  name: string,
  combined: Map<string, string>,
  depth = 0,
): string | null {
  if (depth > 10) return null
  const raw = combined.get(name)
  if (raw === undefined) return null
  if (raw.startsWith('calc(')) return raw
  const simpleVar = /^var\((--cascivo-[\w-]+)\)$/.exec(raw)
  if (simpleVar) return resolveInTheme(simpleVar[1]!, combined, depth + 1)
  return raw
}

/** Build the variant matrix from the token index CSS and the theme CSS files. */
export function buildVariantMatrix(
  indexCss: string,
  themes: { name: string; css: string }[],
): VariantMatrix {
  const indexMap = extractDeclarations(indexCss)
  const themeMaps = themes.map((t) => ({
    name: t.name,
    map: new Map([...indexMap, ...extractDeclarations(t.css)]),
  }))

  // Token universe: every name declared in the index or any theme.
  const names = new Set<string>(indexMap.keys())
  for (const t of themeMaps) for (const n of t.map.keys()) names.add(n)

  const tokens: VariantToken[] = []
  const families: Record<string, Record<string, string>> = {}

  for (const name of [...names].sort()) {
    const layer = classifyLayer(name)
    // Primitives never shift between themes; the matrix is about the layers an
    // agent reasons over (semantic + component), so skip primitive noise.
    if (layer === 'primitive') continue

    const group = extractGroup(name)
    const byTheme: Record<string, string | null> = {}
    for (const t of themeMaps) byTheme[t.name] = resolveInTheme(name, t.map)

    const token: VariantToken = { name, layer, group, byTheme }
    if (group === 'color') {
      const split = splitRole(name)
      if (split) {
        token.role = split.role
        token.slot = split.slot
        ;(families[split.role] ??= {})[split.slot] = name
      }
    }
    tokens.push(token)
  }

  // Drop single-entry families — those carry no state-shift information.
  for (const role of Object.keys(families)) {
    if (Object.keys(families[role]!).length < 2) delete families[role]
  }

  return {
    generatedFrom: ['packages/tokens/src/index.css', 'packages/themes/src/*.css'],
    generatedAt: new Date().toISOString().slice(0, 10),
    themes: themeMaps.map((t) => t.name),
    families,
    tokens,
  }
}

async function main() {
  const indexCss = await readFile(join(ROOT, 'packages/tokens/src/index.css'), 'utf8')
  const themeDir = join(ROOT, 'packages/themes/src')
  const files = (await readdir(themeDir))
    .filter((f) => f.endsWith('.css') && !NON_THEME_FILES.has(f))
    .sort()
  const themes = await Promise.all(
    files.map(async (f) => ({
      name: f.replace(/\.css$/, ''),
      css: await readFile(join(themeDir, f), 'utf8'),
    })),
  )

  const matrix = buildVariantMatrix(indexCss, themes)

  const outDir = join(ROOT, 'apps/site/public')
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'tokens.variants.json'), JSON.stringify(matrix, null, 2) + '\n')
  console.log(
    `Wrote ${matrix.tokens.length} tokens × ${matrix.themes.length} themes and ` +
      `${Object.keys(matrix.families).length} families to tokens.variants.json`,
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
