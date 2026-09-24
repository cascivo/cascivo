/**
 * Export the token system as W3C Design Tokens (DTCG 2025.10), for Figma variables, Tokens
 * Studio, Style Dictionary, Terrazzo and any other tool that reads the standard.
 *
 *   dtcg/cascivo.tokens.json        every token; semantic → primitive links kept as aliases
 *   dtcg/themes/<theme>.tokens.json the tokens a theme changes, resolved for that theme
 *   dtcg/cascivo.resolver.json      base set + a `theme` modifier over the twelve themes
 *
 * Written to packages/tokens/dtcg (published) and apps/site/public/tokens/dtcg (served, so a
 * design tool can sync from a URL). Inputs are the generated catalogs, so run after
 * `catalog:generate` and `variants:generate` — `pnpm regen` does.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { aliasOf, convertValue, tokenKey, varTarget, type DtcgValue } from './dtcg.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT_DIRS = [join(ROOT, 'packages/tokens/dtcg'), join(ROOT, 'apps/site/public/tokens/dtcg')]

// Bundles and interop sheets are not selectable themes (same list as scripts/readme/generate.ts).
const NON_THEMES = new Set(['light-dark', 'tailwind', 'all', 'base'])

interface CatalogToken {
  name: string
  value: string
  layer: 'primitive' | 'semantic' | 'component'
  group: string
  resolvedDefault?: string | null
}

interface VariantToken {
  name: string
  group: string
  byTheme: Record<string, string>
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

function parseCatalog(raw: unknown): CatalogToken[] {
  if (!isRecord(raw) || !Array.isArray(raw['tokens'])) {
    throw new Error('tokens.catalog.json: expected { tokens: [...] } — run `pnpm catalog:generate`')
  }
  return raw['tokens'].map((t: unknown, i) => {
    if (
      !isRecord(t) ||
      typeof t['name'] !== 'string' ||
      typeof t['value'] !== 'string' ||
      typeof t['group'] !== 'string' ||
      !['primitive', 'semantic', 'component'].includes(String(t['layer']))
    ) {
      throw new Error(`tokens.catalog.json: token #${i} is missing name/value/group/layer`)
    }
    return {
      name: t['name'],
      value: t['value'],
      group: t['group'],
      layer: t['layer'] as CatalogToken['layer'],
      resolvedDefault: typeof t['resolvedDefault'] === 'string' ? t['resolvedDefault'] : null,
    }
  })
}

function parseVariants(raw: unknown): { themes: string[]; tokens: VariantToken[] } {
  if (!isRecord(raw) || !Array.isArray(raw['themes']) || !Array.isArray(raw['tokens'])) {
    throw new Error(
      'tokens.variants.json: expected { themes, tokens } — run `pnpm variants:generate`',
    )
  }
  const themes = raw['themes'].filter((t): t is string => typeof t === 'string')
  const tokens = raw['tokens'].flatMap((t: unknown): VariantToken[] => {
    if (!isRecord(t) || typeof t['name'] !== 'string' || !isRecord(t['byTheme'])) return []
    const byTheme: Record<string, string> = {}
    for (const [k, v] of Object.entries(t['byTheme'])) if (typeof v === 'string') byTheme[k] = v
    return [
      { name: t['name'], group: typeof t['group'] === 'string' ? t['group'] : 'misc', byTheme },
    ]
  })
  return { themes, tokens }
}

type Tree = Record<string, Record<string, unknown>>

function put(tree: Tree, group: string, cssName: string, token: Record<string, unknown>): void {
  ;(tree[group] ??= {})[tokenKey(cssName)] = token
}

async function main(): Promise<void> {
  const catalog = parseCatalog(await readJson(join(ROOT, 'apps/site/public/tokens.catalog.json')))
  const variants = parseVariants(
    await readJson(join(ROOT, 'apps/site/public/tokens.variants.json')),
  )
  const groupOf = new Map(catalog.map((t) => [t.name, t.group]))

  // ── base set ──────────────────────────────────────────────────────────────
  const base: Tree = {}
  const unconverted: string[] = []
  const typeOf = new Map<string, DtcgValue['$type']>()

  // Literal tokens first, so every alias below can be typed from its target.
  for (const t of catalog) {
    if (varTarget(t.value)) continue
    const converted = convertValue(t.resolvedDefault ?? t.value, t.group)
    if (!converted) {
      unconverted.push(t.name)
      continue
    }
    typeOf.set(t.name, converted.$type)
    put(base, t.group, t.name, { ...converted, $description: `CSS: ${t.name} (${t.layer})` })
  }
  // Aliases: resolve chains until a typed literal is reached.
  let pending = catalog.filter((t) => varTarget(t.value))
  for (let pass = 0; pass < 8 && pending.length > 0; pass++) {
    pending = pending.filter((t) => {
      const target = varTarget(t.value) ?? ''
      const type = typeOf.get(target)
      const targetGroup = groupOf.get(target)
      if (!type || !targetGroup) return true
      typeOf.set(t.name, type)
      put(base, t.group, t.name, {
        $type: type,
        $value: aliasOf(targetGroup, target),
        $description: `CSS: ${t.name} (${t.layer}) = var(${target})`,
      })
      return false
    })
  }
  unconverted.push(...pending.map((t) => t.name))

  const baseDoc = {
    $description:
      'cascivo design tokens, exported from the CSS custom properties. Theme values live in themes/*.tokens.json, selected by cascivo.resolver.json.',
    ...base,
    $extensions: {
      'com.cascivo': {
        // Values DTCG cannot express (calc(), em, color-mix()) — consume these from the CSS.
        notExported: unconverted.sort(),
      },
    },
  }

  // ── per-theme sets ────────────────────────────────────────────────────────
  const themes = variants.themes.filter((t) => !NON_THEMES.has(t)).sort()
  const themeDocs = new Map<string, Tree>()
  for (const theme of themes) {
    const tree: Tree = {}
    for (const v of variants.tokens) {
      const raw = v.byTheme[theme]
      const group = groupOf.get(v.name) ?? v.group
      const converted = raw === undefined ? undefined : convertValue(raw, group)
      if (converted) put(tree, group, v.name, converted)
    }
    themeDocs.set(theme, tree)
  }

  const resolver = {
    $schema: 'https://www.designtokens.org/schemas/2025.10/resolver.json',
    version: '2025.10',
    name: 'cascivo',
    description: 'Base tokens, then one of the twelve first-party themes.',
    sets: { base: { sources: [{ $ref: 'cascivo.tokens.json' }] } },
    modifiers: {
      theme: {
        description: 'First-party theme — the value of the data-theme attribute.',
        contexts: Object.fromEntries(themes.map((t) => [t, [{ $ref: `themes/${t}.tokens.json` }]])),
        default: 'light',
      },
    },
    resolutionOrder: [{ $ref: '#/sets/base' }, { $ref: '#/modifiers/theme' }],
  }

  const json = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`
  for (const dir of OUT_DIRS) {
    await rm(dir, { recursive: true, force: true })
    await mkdir(join(dir, 'themes'), { recursive: true })
    await writeFile(join(dir, 'cascivo.tokens.json'), json(baseDoc))
    await writeFile(join(dir, 'cascivo.resolver.json'), json(resolver))
    for (const [theme, tree] of themeDocs) {
      await writeFile(join(dir, 'themes', `${theme}.tokens.json`), json(tree))
    }
  }
  console.log(
    `dtcg: ${typeOf.size} tokens exported, ${unconverted.length} left to CSS, ${themes.length} themes`,
  )
}

await main()
