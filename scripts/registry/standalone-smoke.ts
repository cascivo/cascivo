/**
 * Clean-room standalone-install smoke test.
 *
 * For a representative set of components, simulate `cascivo add <name>`: gather
 * the transitive closure of files (the component + every file shipped by its
 * transitive `registryDependencies`) and assert that every relative import in
 * that file set resolves to a file *within* the set. This proves the installed
 * tree is self-contained — the exact thing the dashboard feedback could not get
 * (`shell-header` resolving `../popover/use-popover`).
 *
 * Run with: `pnpm deps:smoke`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  findEntry,
  parseRelativeImports,
  resolveImportPath,
  transitiveRegistryDeps,
  urlToLocal,
  type RegistryShape,
} from './deps-graph.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(HERE, '..', '..')
const REGISTRY_PATH = join(REPO_ROOT, 'registry.json')

/** Components whose installed trees we compile-check. shell-header is the original failure. */
const SUBJECTS = ['shell-header', 'side-nav', 'menu', 'button', 'data-table', 'field']

function installedFiles(registry: RegistryShape, name: string): Set<string> {
  const entry = findEntry(registry, name)
  if (!entry) throw new Error(`subject "${name}" not in registry`)
  const names = new Set<string>([entry.name, ...transitiveRegistryDeps(registry, name)])
  const files = new Set<string>()
  for (const n of names) {
    const e = findEntry(registry, n)
    for (const url of e?.files ?? []) {
      const local = urlToLocal(url, REPO_ROOT)
      if (local) files.add(local)
    }
  }
  return files
}

async function main(): Promise<void> {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8')) as RegistryShape
  const failures: string[] = []

  for (const subject of SUBJECTS) {
    const files = installedFiles(registry, subject)
    // A relative import is satisfied only if it resolves to a file in the set.
    const existsInSet = (p: string): boolean => files.has(p) || existsSync(p)
    for (const file of files) {
      if (!/\.(ts|tsx)$/.test(file)) continue
      let src: string
      try {
        src = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      for (const spec of parseRelativeImports(src)) {
        const target = resolveImportPath(file, spec, existsInSet)
        if (!target || !files.has(target)) {
          failures.push(`${subject}: ${file} → '${spec}' not in installed set`)
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error(`deps:smoke — ${failures.length} import(s) escape the installed tree:\n`)
    for (const f of failures) console.error(`  ✗ ${f}`)
    process.exit(1)
  }
  console.log(`deps:smoke — OK. Installed trees are self-contained for: ${SUBJECTS.join(', ')}.`)
}

await main()
