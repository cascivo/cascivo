/**
 * Standalone-install integrity guard.
 *
 * Statically asserts that every copy-paste registry component installs and
 * compiles on its own: each relative import in a component's shipped files must
 * resolve to a file shipped by that component or by a component in its
 * transitive `registryDependencies`. Fails (exit 1) on any violation — the bug
 * class behind the dashboard feedback's missing `use-popover` hook.
 *
 * Run with: `pnpm deps:check` (also runs in `regen`/CI).
 */
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findViolations, type RegistryShape } from './deps-graph.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

async function main(): Promise<void> {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8')) as RegistryShape

  const readSource = (localPath: string): string | null => {
    try {
      return readFileSync(localPath, 'utf8')
    } catch {
      return null
    }
  }

  const violations = findViolations(registry, REPO_ROOT, readSource)

  if (violations.length === 0) {
    console.log(`deps:check — OK. Every component's internal imports are resolvable.`)
    return
  }

  console.error(`deps:check — ${violations.length} unresolved internal dependency(ies):\n`)
  for (const v of violations) {
    if (v.kind === 'undeclared') {
      console.error(
        `  ✗ ${v.component}: ${v.file} imports '${v.spec}' (owned by "${v.owner}") ` +
          `but does not declare registryDependencies: ['${v.owner}'].`,
      )
    } else {
      console.error(
        `  ✗ ${v.component}: ${v.file} imports '${v.spec}', which no registry component ships.`,
      )
    }
  }
  console.error(
    `\nFix: add the owning component to the importer's registryDependencies in its *.meta.ts, ` +
      `or ship the missing file. See docs/ROADMAP-V57.md (T1/T2).`,
  )
  process.exit(1)
}

await main()
