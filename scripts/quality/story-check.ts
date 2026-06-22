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
 *  2. Component coverage (INFORMATIONAL — never exits 1):
 *     Registry entries without a story are reported as a backlog. Many
 *     components are not yet storied; a human decides when to close the gap.
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

// --- Check 2: component coverage (informational) ----------------------------
const missing = components
  .filter((c) => !storyKeys.has(toKebab(c.name.split('/').pop() ?? c.name)))
  .map((c) => `${c.name}${c.type && c.type !== 'component' ? ` (${c.type})` : ''}`)

if (missing.length > 0) {
  console.log(`Story coverage backlog — ${missing.length} registry entries without a story:`)
  missing.forEach((m) => console.log(`  - ${m}`))
} else {
  console.log(`All ${components.length} registry entries have Storybook stories.`)
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
