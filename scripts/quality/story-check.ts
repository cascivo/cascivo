/**
 * Story audit (`pnpm audit:stories`).
 *
 * Two checks over apps/storybook/stories:
 *
 *  1. Orphan stories (ENFORCED — exits 1):
 *     Every `*.stories.tsx` must map to a registry entry, or be listed in
 *     NON_COMPONENT_STORIES. Catches typos, renamed/removed components, and
 *     stray stories. Page-style stories that have no registry component (the
 *     Design Tokens catalog, AI demos, the intro page) live in the allowlist.
 *
 *  2. Component coverage (ENFORCED for `component`-type entries — exits 1):
 *     Every registry entry of type `component` must have a hand-written or
 *     generated story (`pnpm stories:generate`), or be listed with a reason in
 *     COMPONENT_STORY_EXCLUSIONS. Entries of other types (layout, block,
 *     chart, …) without a story are still reported as an informational
 *     backlog.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))

/**
 * Stories that intentionally have no registry component: docs/landing pages and
 * AI/chart overview demos. Keys are kebab-cased story basenames. Add an entry
 * here when introducing a deliberate non-component story.
 */
const NON_COMPONENT_STORIES = new Set([
  'introduction',
  'design-tokens',
  'ai-chat',
  'ai-label',
  'streaming-text',
  'terminal',
  'plain-charts',
  // Glyph ships from @cascivo/icons (packages/icons), not the copy-paste
  // component registry — its story is a showcase, not a registry component.
  'glyph',
])

/**
 * `component`-type registry entries with no story, with the reason. These are
 * exactly the components `pnpm stories:generate` cannot generate for: every
 * one of their manifest examples references free identifiers (handlers, state
 * setters, placeholder child components, or icon names that do not exist in
 * `@cascivo/icons`), so no example compiles standalone. Remove an entry after
 * hand-writing a story or making at least one manifest example self-contained.
 */
const COMPONENT_STORY_EXCLUSIONS = new Map<string, string>([
  ['action-sheet', 'both examples reference free identifiers (isOpen/setIsOpen, action handlers)'],
  ['app-shell', 'both examples reference free identifiers (items, header, nav, open signal)'],
  [
    'bottom-sheet',
    'both examples reference free identifiers (isOpen/setIsOpen, FilterForm, PlacesList)',
  ],
  [
    'drawer',
    'both examples reference free identifiers (isOpen/setIsOpen, SettingsForm, OrderDetails)',
  ],
  ['fab', 'all examples reference nonexistent icons (PlusIcon, NoteIcon, …) and free handlers'],
  ['icon-button', 'all examples reference nonexistent icons (GearIcon, PlusIcon, HomeIcon)'],
  ['menu-button', 'both examples reference free identifiers (edit, duplicate, createDoc, …)'],
  [
    'pull-to-refresh',
    'both examples reference free identifiers (refetch, FeedList, MessageList, …)',
  ],
  ['relative-time', 'all examples reference free identifiers (post.createdAt, date)'],
  ['resizable', 'both examples reference placeholder children (Editor, Preview, Toolbar, Canvas)'],
  ['swap', 'both examples reference nonexistent icons (SunIcon, MoonIcon, HeartIcon, …)'],
  ['swipe-item', 'both examples reference free identifiers (archive, remove, MessageRow, …)'],
  [
    'tile',
    'both examples reference free identifiers (plan/setPlan) or a nonexistent icon (BellIcon)',
  ],
  ['toggletip', 'both examples reference a nonexistent icon (InfoIcon) or free open/setOpen'],
])

let registry: { components?: { name: string; type?: string }[] }
try {
  registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'))
} catch {
  console.error('registry.json not found — run pnpm registry:generate first')
  process.exit(1)
}

const storiesDir = join(root, 'apps', 'storybook', 'stories')
const components = registry.components ?? []

/** Normalise any casing (PascalCase, camelCase, kebab) to a kebab-case key. */
function toKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

/** All `*.stories.tsx` basenames under the stories dir (recursive), kebab-cased. */
function collectStoryKeys(): string[] {
  const entries = readdirSync(storiesDir, { recursive: true, withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.stories.tsx'))
    .map((e) => toKebab(e.name.replace(/\.stories\.tsx$/, '')))
}

const storyKeys = new Set(collectStoryKeys())
// Registry names may be namespaced (e.g. "chart/bar-chart", "layout/auto-grid");
// the story file is keyed by the leaf segment.
const registryKeys = new Set(components.map((c) => toKebab(c.name.split('/').pop() ?? c.name)))

// --- Check 1: orphan stories (enforced) -------------------------------------
const orphans = [...storyKeys].filter(
  (key) => !registryKeys.has(key) && !NON_COMPONENT_STORIES.has(key),
)

// --- Check 2: component coverage (enforced for `component`-type entries) ----
const missing = components.filter((c) => !storyKeys.has(toKebab(c.name.split('/').pop() ?? c.name)))

const missingComponents = missing
  .filter((c) => (c.type ?? 'component') === 'component')
  .map((c) => toKebab(c.name.split('/').pop() ?? c.name))
const uncovered = missingComponents.filter((key) => !COMPONENT_STORY_EXCLUSIONS.has(key))
const staleExclusions = [...COMPONENT_STORY_EXCLUSIONS.keys()].filter(
  (key) => !missingComponents.includes(key),
)

const backlog = missing
  .filter((c) => (c.type ?? 'component') !== 'component')
  .map((c) => `${c.name} (${c.type})`)

if (backlog.length > 0) {
  console.log(`Story coverage backlog — ${backlog.length} non-component entries without a story:`)
  backlog.forEach((m) => console.log(`  - ${m}`))
}
const componentTotal = components.filter((c) => (c.type ?? 'component') === 'component').length
console.log(
  `Component coverage: ${componentTotal - missingComponents.length} of ${componentTotal} component entries storied, ${missingComponents.length - uncovered.length} excluded.`,
)

if (uncovered.length > 0) {
  console.error(
    `\nComponent coverage gap — ${uncovered.length} component-type registry entries with no story:`,
  )
  uncovered.forEach((k) => console.error(`  - ${k}`))
  console.error(
    '\nRun `pnpm stories:generate`, hand-write a story, or add the name with a reason to COMPONENT_STORY_EXCLUSIONS in scripts/quality/story-check.ts.',
  )
  process.exit(1)
}

if (staleExclusions.length > 0) {
  console.error(
    `\nStale exclusions — ${staleExclusions.length} COMPONENT_STORY_EXCLUSIONS entries that now have a story (or left the registry):`,
  )
  staleExclusions.forEach((k) => console.error(`  - ${k}`))
  console.error('\nRemove them from COMPONENT_STORY_EXCLUSIONS in scripts/quality/story-check.ts.')
  process.exit(1)
}

if (orphans.length > 0) {
  console.error(`\nOrphan stories — ${orphans.length} story file(s) with no registry match:`)
  orphans.forEach((o) => console.error(`  - ${o}.stories.tsx`))
  console.error(
    '\nIf intentional (a docs/page story), add its kebab name to NON_COMPONENT_STORIES in scripts/quality/story-check.ts.',
  )
  process.exit(1)
}

console.log(
  `\nNo orphan stories: all ${storyKeys.size} story files map to a registry entry or the allowlist.`,
)
