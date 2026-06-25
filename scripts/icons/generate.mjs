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
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const SVG_DIR = join(ROOT, 'packages/icons/svg')
const OUT_TSX = join(ROOT, 'packages/icons/src/generated.tsx')
const INDEX_TSX = join(ROOT, 'packages/icons/src/index.tsx')
const META_JSON = join(SVG_DIR, 'metadata.json')
const OUT_CATALOG = join(ROOT, 'apps/site/public/icons.catalog.json')

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

/** Build the deduped keyword list for an icon. */
function buildKeywords(kebab, metaKeywords) {
  const tokens = new Set(kebab.split('-').filter(Boolean))
  if (metaKeywords) {
    for (const w of metaKeywords.split(/\s+/).filter(Boolean)) tokens.add(w.toLowerCase())
  }
  // Snapshot before expanding so synonyms-of-synonyms don't compound.
  const seeds = Array.from(tokens)
  for (const token of seeds) {
    for (const syn of SYNONYMS[token] ?? []) tokens.add(syn)
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
    const frag = children.match(/^<>([\s\S]*)<\/>$/)
    if (frag) children = frag[1]
    children = children.replace(/\s+/g, ' ').trim()
    out.push({ pascal: nameMatch[1], svg: children })
  }
  return out
}

function main() {
  const metadata = JSON.parse(readFileSync(META_JSON, 'utf8'))
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
      keywords: buildKeywords(kebab, meta.keywords),
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
  writeFileSync(OUT_TSX, lines.join('\n') + '\n')

  // 2. Emit icons.catalog.json — metadata for the docs gallery + AI surfaces.
  //    Schema: { generatedFrom, count, icons: Array<{
  //      name: string         // kebab-case id ('alert-circle')
  //      pascalName: string   // export name from @cascivo/icons ('AlertCircle')
  //      category: string     // 'general' (Feather) | 'app-ui' | 'health' | 'science'
  //      tags: string[]       // source grouping ('feather' | 'ui' | 'health' | …)
  //      keywords: string[]   // search terms: name tokens + synonyms + source keywords
  //      svg: string          // inner geometry markup (no <svg> wrapper)
  //    }> }  — consumed by apps/site IconsPage + global search + llms.txt.
  const existing = parseExistingIcons(readFileSync(INDEX_TSX, 'utf8')).map(({ pascal, svg }) => {
    const kebab = toKebabCase(pascal)
    return {
      name: kebab,
      pascalName: pascal,
      category: 'general',
      tags: ['feather'],
      keywords: buildKeywords(kebab),
      svg,
    }
  })
  const generated = icons.map(({ kebab, pascal, elements, tags, category, keywords }) => ({
    name: kebab,
    pascalName: pascal,
    category,
    tags,
    keywords,
    svg: elements.join(''),
  }))
  const all = [...existing, ...generated].sort((a, b) => a.name.localeCompare(b.name))
  const catalog = {
    generatedFrom:
      'packages/icons/svg (chromicons, MIT) + packages/icons/src/index.tsx (Feather, MIT)',
    count: all.length,
    icons: all,
  }
  writeFileSync(OUT_CATALOG, JSON.stringify(catalog, null, 2) + '\n')

  console.log(
    `Wrote ${icons.length} icons to generated.tsx (${skipped} skipped) and ${all.length} to icons.catalog.json`,
  )
}

main()
