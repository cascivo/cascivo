/**
 * Icon generator.
 *
 * Reads the vendored chromicons SVG source (packages/icons/svg/*.svg, MIT —
 * see NOTICE) and emits packages/icons/src/generated.tsx: one `createIcon`
 * export per icon. Each source SVG is normalized — the presentation
 * attributes `createIcon` already supplies (stroke/fill/stroke-width/
 * stroke-linecap/stroke-linejoin/stroke-miterlimit/class) are stripped, the
 * inner geometry is kept, and the kebab-case filename is mapped to PascalCase.
 * Names that collide with the existing hand-authored Feather-derived set are
 * skipped — the existing export always wins, so v45 is purely additive.
 *
 * Mirrors the tokens pipeline (scripts/catalog/generate.ts → tokens.catalog.json).
 * Deterministic + idempotent: a second run produces no diff.
 *
 * Run with: `pnpm icons:generate`
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SVG_DIR = join(ROOT, 'packages/icons/svg')
const OUT_TSX = join(ROOT, 'packages/icons/src/generated.tsx')
const INDEX_TSX = join(ROOT, 'packages/icons/src/index.tsx')
const META_JSON = join(SVG_DIR, 'metadata.json')
const ALIASES_JSON = join(SVG_DIR, 'aliases.json')
const OUT_CATALOG = join(ROOT, 'apps/site/public/icons.catalog.json')

/**
 * Foreign/common names (Lucide/Radix/Heroicons/intent words) → cascivo pascalName.
 * Keyed by pascalName; the `_comment` key is skipped. Folded into keywords and
 * surfaced as a catalog `aliases` field so an agent guessing `LayoutDashboard`
 * finds `Dashboard`, `Rocket` finds `Spaceship`, etc.
 */
function loadAliases() {
  const raw = JSON.parse(readFileSync(ALIASES_JSON, 'utf8'))
  const out = {}
  for (const [pascal, list] of Object.entries(raw)) {
    if (pascal === '_comment' || !Array.isArray(list)) continue
    out[pascal] = list
  }
  return out
}

/**
 * The 60 hand-authored Feather-derived icons already exported from index.tsx.
 * On a name collision the existing export wins, so these chromicons are skipped.
 * Keep this list in sync with the inline exports in packages/icons/src/index.tsx.
 */
const EXISTING = new Set([
  'Activity',
  'AlertCircle',
  'AlertTriangle',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'BarChart',
  'Bell',
  'Calendar',
  'Check',
  'CheckCircle',
  'ChevronDown',
  'ChevronLeft',
  'ChevronRight',
  'ChevronUp',
  'Clock',
  'Copy',
  'CreditCard',
  'Dashboard',
  'Database',
  'Download',
  'Edit',
  'ExternalLink',
  'Eye',
  'EyeOff',
  'File',
  'Filter',
  'Folder',
  'Globe',
  'Grid',
  'Heart',
  'HelpCircle',
  'Home',
  'Inbox',
  'Info',
  'Key',
  'Layers',
  'Loader',
  'Lock',
  'LogOut',
  'Menu',
  'Minus',
  'Moon',
  'MoreHorizontal',
  'Plus',
  'Search',
  'Server',
  'Settings',
  'Shield',
  'Star',
  'Sun',
  'Tag',
  'Terminal',
  'Trash',
  'Upload',
  'User',
  'Users',
  'X',
  'Zap',
])

/** Presentation attributes createIcon already supplies — stripped from inner geometry. */
const STRIP_ATTRS = [
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke',
  'fill',
  'class',
  'data-name',
  'id',
]

/** `alert-circle` → `AlertCircle`. */
function toPascalCase(kebab) {
  return kebab
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

/** Strip a single self-closed element down to geometry-only, JSX-ready. */
function cleanElement(el) {
  let out = el
  for (const attr of STRIP_ATTRS) {
    out = out.replace(new RegExp(`\\s+${attr}="[^"]*"`, 'g'), '')
  }
  // kebab attr → camelCase (none survive the strip today, but keep it robust)
  out = out.replace(
    /\s([a-z]+)-([a-z]+)=/g,
    (_m, a, b) => ` ${a}${b.charAt(0).toUpperCase()}${b.slice(1)}=`,
  )
  out = out.replace(/\s+/g, ' ').replace(/\s*\/>$/, ' />')
  return out
}

/** Extract + normalize the inner geometry of one source SVG. */
function normalize(svg, file) {
  const match = svg.match(/<svg[^>]*viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/svg>/)
  if (!match) {
    throw new Error(`${file}: not a viewBox="0 0 24 24" SVG (off-grid icons are rejected)`)
  }
  const elements = match[1].match(/<[a-zA-Z][^>]*?\/>/g)
  if (!elements || elements.length === 0) {
    throw new Error(`${file}: no geometry elements found`)
  }
  return elements.map(cleanElement)
}

/** Emit the `createIcon(...)` body for an icon's normalized elements. */
function renderChildren(elements) {
  if (elements.length === 1) {
    return elements[0]
  }
  return `<>\n    ${elements.join('\n    ')}\n  </>`
}

/**
 * Split a hand-authored icon's inner JSX into its top-level elements, so an alias can be
 * emitted through the same `renderChildren` path as a generated icon (and therefore in the
 * shape oxfmt already produces — a differently-formatted alias would make `pnpm regen`
 * non-idempotent and fail the drift check). Every icon body here is a flat list of
 * self-closing SVG elements, so a tag scan is enough; there is no nesting to track.
 */
function splitElements(svg) {
  return svg.match(/<[A-Za-z][^>]*\/>/g) ?? [svg]
}

/** `AlertCircle` → `alert-circle`. */
function toKebabCase(pascal) {
  return pascal
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * A small, explicit synonym map — adopts hugeicons' rich-keyword idea without
 * the library. Keyed by a name token, expands to extra search keywords.
 */
const SYNONYMS = {
  trash: ['delete', 'remove', 'bin'],
  edit: ['pencil', 'write'],
  search: ['find', 'magnifier'],
  bell: ['notification', 'alert'],
  star: ['favorite', 'bookmark'],
  heart: ['like', 'love', 'favorite'],
  user: ['person', 'account', 'profile'],
  users: ['people', 'group', 'team'],
  home: ['house'],
  cog: ['settings', 'gear'],
  settings: ['gear', 'cog', 'preferences'],
  image: ['picture', 'photo'],
  camera: ['photo'],
  mail: ['email', 'envelope'],
  lock: ['secure', 'private'],
  unlock: ['open', 'access'],
  calendar: ['date', 'schedule'],
  clock: ['time', 'watch'],
  chart: ['graph', 'analytics'],
  cart: ['shopping', 'basket'],
  download: ['save'],
  upload: ['send'],
  play: ['start', 'media'],
  pause: ['stop', 'media'],
  warning: ['alert', 'danger', 'caution'],
  alert: ['warning', 'danger'],
  check: ['done', 'success', 'tick'],
}

/** Map chromicons category arrays → a single cascivo category. */
function pickCategory(categories) {
  if (!categories || categories.length === 0) return 'app-ui'
  if (categories.includes('health')) return 'health'
  if (categories.includes('science')) return 'science'
  return 'app-ui'
}

/** Search tokens an alias expands to: the lowercased whole + camelCase/kebab parts. */
function aliasTokens(alias) {
  const spaced = alias.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')
  const parts = spaced.split(/\s+/).filter(Boolean)
  return [alias.toLowerCase(), ...parts.map((p) => p.toLowerCase())]
}

/**
 * Alias names that stay search-only, with the export they would shadow.
 *
 * An alias becomes a REAL export (see `aliasExports`) so the familiar guess just works —
 * `import { Rocket } from '@cascivo/icons'` after the reporter burned a lookup finding
 * `Spaceship`, and the recipe doc's headline use case is a deploy console (2026-08-31 report
 * §19). The exception is a name already claimed elsewhere in the three packages a dashboard
 * imports together: `Kbd` is a component, `LineChart` is a chart, and `Box`/`Delete`/`Trash2`
 * are icons in their own right. Exporting those would turn a documented aliasing convention
 * into a silent wrong resolution — the exact hazard `scripts/checks/export-collisions.test.ts`
 * exists to cap.
 */
const ALIAS_EXPORT_DENYLIST = new Set(['Box', 'Delete', 'Kbd', 'LineChart', 'Trash2'])

/**
 * PascalCase aliases that are safe to export, as `[aliasName, targetName]` pairs.
 *
 * Lowercase intent words from aliases.json ('deploy', 'launch', 'tune') stay search-only —
 * they are keywords, not identifiers.
 */
function aliasExports(aliases, iconNames) {
  const pairs = []
  for (const [pascal, list] of Object.entries(aliases)) {
    if (!iconNames.has(pascal)) continue
    for (const alias of list) {
      if (!/^[A-Z][A-Za-z0-9]*$/.test(alias)) continue
      if (iconNames.has(alias) || ALIAS_EXPORT_DENYLIST.has(alias)) continue
      pairs.push([alias, pascal])
    }
  }
  pairs.sort((a, b) => a[0].localeCompare(b[0]))
  return pairs
}

/** Build the deduped keyword list for an icon (name tokens + synonyms + aliases). */
function buildKeywords(kebab, metaKeywords, aliases = []) {
  const tokens = new Set(kebab.split('-').filter(Boolean))
  if (metaKeywords) {
    for (const w of metaKeywords.split(/\s+/).filter(Boolean)) tokens.add(w.toLowerCase())
  }
  // Snapshot before expanding so synonyms-of-synonyms don't compound.
  const seeds = Array.from(tokens)
  for (const token of seeds) {
    for (const syn of SYNONYMS[token] ?? []) tokens.add(syn)
  }
  for (const alias of aliases) {
    for (const t of aliasTokens(alias)) tokens.add(t)
  }
  return [...tokens].sort()
}

/**
 * Extract the existing hand-authored icons (name → normalized inner markup) by
 * scanning index.tsx's `createIcon('Name', <children>)` calls with a balanced
 * paren walk. Used so the catalog is complete (existing + generated).
 */
function parseExistingIcons(src) {
  const out = []
  const re = /export const \w+ = createIcon\(/g
  while (re.exec(src) !== null) {
    let depth = 1
    let i = re.lastIndex
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
    }
    const args = src.slice(re.lastIndex, i - 1)
    const nameMatch = args.match(/^\s*'([^']+)'\s*,/)
    if (!nameMatch) continue
    let children = args.slice(nameMatch[0].length).trim().replace(/,\s*$/, '')
    // `jsx` keeps the children expression exactly as authored (fragment and all) so it can be
    // re-emitted verbatim for an alias; `svg` is the fragment-unwrapped form the catalog wants.
    const jsx = children.replace(/\s+/g, ' ').trim()
    const frag = children.match(/^<>([\s\S]*)<\/>$/)
    if (frag) children = frag[1]
    children = children.replace(/\s+/g, ' ').trim()
    out.push({ pascal: nameMatch[1], svg: children, jsx })
  }
  return out
}

function main() {
  const metadata = JSON.parse(readFileSync(META_JSON, 'utf8'))
  const aliases = loadAliases()
  const files = readdirSync(SVG_DIR)
    .filter((f) => f.endsWith('.svg'))
    .sort()

  const icons = []
  let skipped = 0
  for (const file of files) {
    const kebab = file.replace(/\.svg$/, '')
    const pascal = toPascalCase(kebab)
    if (EXISTING.has(pascal)) {
      skipped++
      continue
    }
    const elements = normalize(readFileSync(join(SVG_DIR, file), 'utf8'), file)
    const meta = metadata[pascal] ?? {}
    icons.push({
      kebab,
      pascal,
      elements,
      tags: meta.categories ?? ['ui'],
      category: pickCategory(meta.categories),
      keywords: buildKeywords(kebab, meta.keywords, aliases[pascal]),
      aliases: aliases[pascal] ?? [],
    })
  }
  icons.sort((a, b) => a.pascal.localeCompare(b.pascal))

  // 1. Emit generated.tsx — the createIcon exports.
  const lines = [
    '// GENERATED by scripts/icons/generate.mjs — do not edit by hand.',
    '// Geometry: chromicons (MIT). See NOTICE. Run `pnpm icons:generate` to refresh.',
    "import { createIcon } from './create-icon'",
    '',
  ]
  for (const { pascal, elements } of icons) {
    if (elements.length === 1) {
      lines.push(`export const ${pascal} = createIcon('${pascal}', ${elements[0]})`)
    } else {
      lines.push(`export const ${pascal} = createIcon(`)
      lines.push(`  '${pascal}',`)
      lines.push(`  ${renderChildren(elements)},`)
      lines.push(')')
    }
  }
  /*
   * Alias exports — the familiar name from another set resolves to the cascivo icon, so
   * `import { Rocket }` and `import { LayoutDashboard }` just work.
   *
   * Each alias re-DEFINES its target's geometry rather than re-binding it. A re-binding is
   * what you would write by hand, and it cannot work here: nearly every alias target is one
   * of the hand-authored icons in index.tsx, and index.tsx ends with `export * from
   * './generated'` — so a `from './index'` import in this file makes the cycle evaluate
   * generated.tsx first and every alias reads its target in the temporal dead zone. Repeating
   * ~40 short geometry strings is the cheaper problem, and each one still tree-shakes on its
   * own.
   */
  const existingIcons = parseExistingIcons(readFileSync(INDEX_TSX, 'utf8'))
  const geometry = new Map(existingIcons.map((i) => [i.pascal, splitElements(i.svg)]))
  for (const { pascal, elements } of icons) geometry.set(pascal, elements)
  const aliasPairs = aliasExports(aliases, new Set(geometry.keys()))
  lines.push('')
  lines.push('// Aliases — the familiar name from another icon set, same geometry.')
  for (const [alias, target] of aliasPairs) {
    const elements = geometry.get(target)
    if (elements.length === 1) {
      lines.push(`export const ${alias} = createIcon('${alias}', ${elements[0]})`)
    } else {
      lines.push(`export const ${alias} = createIcon(`)
      lines.push(`  '${alias}',`)
      lines.push(`  ${renderChildren(elements)},`)
      lines.push(')')
    }
  }
  writeFileSync(OUT_TSX, lines.join('\n') + '\n')

  // 1b. Emit one entry module per icon, for `@cascivo/icons/icons/<Name>` subpaths.
  //
  //     Tree-shaking off the barrel already works (verified: 4 imported icons -> 1 SVG path
  //     in the bundle), so this is for consumers whose bundler does NOT tree-shake well, and
  //     for agents that want a narrow, greppable import (2026-07-28 report C8).
  //
  //     Each file DEFINES its icon rather than re-exporting it from the barrel. A re-export
  //     looks tidier but is useless here: built as 443 entries that all import `../generated`,
  //     rolldown hoists the shared module into one 108 kB chunk that every per-icon file then
  //     imports — so a subpath import pulls the whole set and only tree-shaking saves it,
  //     which is precisely the thing these subpaths exist to not depend on. Defining inline
  //     leaves `./create-icon` as the only shared import.
  const singleDir = join(ROOT, 'packages/icons/src/single')
  rmSync(singleDir, { recursive: true, force: true })
  mkdirSync(singleDir, { recursive: true })
  const subpathEntries = []
  for (const { pascal, elements } of icons) {
    const body =
      elements.length === 1
        ? `export const ${pascal} = createIcon('${pascal}', ${elements[0]})`
        : `export const ${pascal} = createIcon(\n  '${pascal}',\n  ${renderChildren(elements)},\n)`
    writeFileSync(
      join(singleDir, `${pascal}.tsx`),
      '// GENERATED by scripts/icons/generate.mjs — do not edit by hand.\n' +
        "import { createIcon } from '../create-icon'\n\n" +
        body +
        '\n',
    )
    subpathEntries.push(pascal)
  }
  // The hand-written icons in index.tsx keep their single definition there; their subpath
  // modules re-export, so the subpath surface still covers the whole barrel. They are few
  // (60) and small, so the shared-chunk cost that rules out re-exports above is negligible.
  const handWritten = existingIcons.map((i) => i.pascal)
  for (const name of handWritten) {
    writeFileSync(
      join(singleDir, `${name}.tsx`),
      '// GENERATED by scripts/icons/generate.mjs — do not edit by hand.\n' +
        `export { ${name} } from '../index'\n`,
    )
    subpathEntries.push(name)
  }
  // Aliases get subpath modules too, so the narrow-import surface covers the whole barrel.
  // A re-export is right here (unlike for the generated icons above): the alias is one
  // binding in generated.tsx, not a definition worth duplicating a third time.
  for (const [alias] of aliasPairs) {
    writeFileSync(
      join(singleDir, `${alias}.tsx`),
      '// GENERATED by scripts/icons/generate.mjs — do not edit by hand.\n' +
        `export { ${alias} } from '../generated'\n`,
    )
    subpathEntries.push(alias)
  }
  subpathEntries.sort()
  writeFileSync(join(singleDir, 'entries.json'), JSON.stringify(subpathEntries, null, 2) + '\n')

  // 2. Emit icons.catalog.json — metadata for the docs gallery + AI surfaces.
  //    Schema: { generatedFrom, count, icons: Array<{
  //      name: string         // kebab-case id ('alert-circle')
  //      pascalName: string   // export name from @cascivo/icons ('AlertCircle')
  //      category: string     // 'general' (Feather) | 'app-ui' | 'health' | 'science'
  //      tags: string[]       // source grouping ('feather' | 'ui' | 'health' | …)
  //      keywords: string[]   // search terms: name tokens + synonyms + aliases + source keywords
  //      aliases: string[]    // foreign/common names this icon answers to (Lucide/Radix/intent)
  //      svg: string          // inner geometry markup (no <svg> wrapper)
  //    }> }  — consumed by apps/site IconsPage + global search + llms.txt + MCP search_icons.
  const existing = parseExistingIcons(readFileSync(INDEX_TSX, 'utf8')).map(({ pascal, svg }) => {
    const kebab = toKebabCase(pascal)
    return {
      name: kebab,
      pascalName: pascal,
      category: 'general',
      tags: ['feather'],
      keywords: buildKeywords(kebab, undefined, aliases[pascal]),
      aliases: aliases[pascal] ?? [],
      svg,
    }
  })
  const generated = icons.map(
    ({ kebab, pascal, elements, tags, category, keywords, aliases: al }) => ({
      name: kebab,
      pascalName: pascal,
      category,
      tags,
      keywords,
      aliases: al,
      svg: elements.join(''),
    }),
  )
  const all = [...existing, ...generated].sort((a, b) => a.name.localeCompare(b.name))
  const catalog = {
    generatedFrom:
      'packages/icons/svg (chromicons, MIT) + packages/icons/src/index.tsx (Feather, MIT)',
    count: all.length,
    icons: all,
  }
  writeFileSync(OUT_CATALOG, JSON.stringify(catalog, null, 2) + '\n')

  console.log(
    `Wrote ${icons.length} icons to generated.tsx (${skipped} skipped), ${subpathEntries.length} subpath entries to src/single/, and ${all.length} to icons.catalog.json`,
  )
}

main()
