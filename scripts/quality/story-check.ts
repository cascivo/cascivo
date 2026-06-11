import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))

// Read registry
let registry: { components?: { name: string }[] }
try {
  registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'))
} catch {
  console.error('registry.json not found — run pnpm registry:generate first')
  process.exit(1)
}

const storiesDir = join(root, 'apps', 'storybook', 'stories')
const components = registry.components ?? []

/** Convert kebab-case to PascalCase: alert-dialog → AlertDialog */
function toPascalCase(kebab: string): string {
  return kebab.replace(/(^|-)([a-z])/g, (_, _sep, letter: string) => letter.toUpperCase())
}

const missing: string[] = []
for (const { name } of components) {
  // registry names are already kebab-case (e.g. "alert-dialog")
  const kebab = name
  const pascal = toPascalCase(kebab)
  const kebabStory = join(storiesDir, `${kebab}.stories.tsx`)
  const pascalStory = join(storiesDir, `${pascal}.stories.tsx`)
  if (!existsSync(kebabStory) && !existsSync(pascalStory)) {
    missing.push(`${name}: no story at ${kebab}.stories.tsx or ${pascal}.stories.tsx`)
  }
}

if (missing.length > 0) {
  console.log(`Missing stories (${missing.length}):`)
  missing.forEach((m) => console.log(`  - ${m}`))
  // Don't exit 1 — just report; human decides if these are blocking
} else {
  console.log(`All ${components.length} registry components have Storybook stories.`)
}
