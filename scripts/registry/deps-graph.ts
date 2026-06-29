/**
 * Shared helpers for the standalone-install integrity guards
 * (`deps-check.ts`, `standalone-smoke.ts`).
 *
 * The model: every copy-paste registry component ships a set of source files.
 * A component installs standalone iff every **relative** import in its files
 * resolves to a file that is either (a) shipped by the component itself or
 * (b) shipped by a component in its transitive `registryDependencies`. These
 * helpers are pure (disk access is injected) so they can be unit-tested.
 */
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

export const BASE_URL = (
  process.env.REGISTRY_BASE_URL ?? 'https://raw.githubusercontent.com/cascivo/cascivo/main'
).replace(/\/+$/, '')

export interface RegistryEntry {
  name: string
  type?: string
  files: string[]
  registryDependencies?: string[]
  install?: string
}

export interface RegistryShape {
  components: RegistryEntry[]
}

/** Extract relative import/export specifiers (`./`, `../`) from a source file. */
export function parseRelativeImports(src: string): string[] {
  const specs = new Set<string>()
  const patterns = [
    /\b(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g, // import/export ... from '…'
    /\bimport\s*['"]([^'"]+)['"]/g, // side-effect import '…'
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // dynamic import('…')
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) !== null) {
      const spec = m[1]
      if (spec && spec.startsWith('.')) specs.add(spec)
    }
  }
  return [...specs]
}

const RESOLVE_EXTS = ['', '.ts', '.tsx', '.module.css', '.css', '/index.ts', '/index.tsx']

/**
 * Resolve a relative import to an absolute source path, trying the candidate
 * extensions. `exists` is injected so this stays pure/testable.
 */
export function resolveImportPath(
  importerAbs: string,
  spec: string,
  exists: (p: string) => boolean = existsSync,
): string | null {
  const base = resolve(dirname(importerAbs), spec)
  for (const ext of RESOLVE_EXTS) {
    const candidate = base + ext
    if (exists(candidate)) return candidate
  }
  return null
}

/** Map a raw-GitHub file URL to its local repo path (null if not ours). */
export function urlToLocal(url: string, repoRoot: string): string | null {
  if (!url.startsWith(BASE_URL)) return null
  return join(repoRoot, url.slice(BASE_URL.length + 1))
}

/** Resolve a `registryDependencies` name to its entry (exact or unambiguous suffix). */
export function findEntry(registry: RegistryShape, name: string): RegistryEntry | undefined {
  const target = name.toLowerCase()
  const exact = registry.components.find((c) => c.name.toLowerCase() === target)
  if (exact) return exact
  const suffix = `/${target}`
  const matches = registry.components.filter((c) => c.name.toLowerCase().endsWith(suffix))
  return matches.length === 1 ? matches[0] : undefined
}

/** The transitive set of registry-dependency entry names for a component (excludes self). */
export function transitiveRegistryDeps(registry: RegistryShape, name: string): Set<string> {
  const out = new Set<string>()
  const queue = [...(findEntry(registry, name)?.registryDependencies ?? [])]
  while (queue.length > 0) {
    const dep = queue.shift()!
    const entry = findEntry(registry, dep)
    if (!entry || out.has(entry.name)) continue
    out.add(entry.name)
    queue.push(...(entry.registryDependencies ?? []))
  }
  return out
}

export interface Violation {
  component: string
  file: string
  spec: string
  kind: 'unshipped' | 'undeclared'
  owner?: string
}

/** A component is copy-paste (its files ship) vs npm-installed (empty files / `install`). */
export function isCopyPaste(entry: RegistryEntry): boolean {
  return !entry.install && entry.files.length > 0
}

/**
 * Audit the whole registry. `readSource(localPath)` returns file contents (or
 * null if unreadable). Returns every violation: a relative import that resolves
 * to a file no shipped component provides (`unshipped`), or to a file owned by a
 * component not in the importer's transitive `registryDependencies` (`undeclared`).
 */
export function findViolations(
  registry: RegistryShape,
  repoRoot: string,
  readSource: (localPath: string) => string | null,
  exists: (p: string) => boolean = existsSync,
): Violation[] {
  // Map every shipped local file path → owning component name.
  const owner = new Map<string, string>()
  for (const c of registry.components) {
    if (!isCopyPaste(c)) continue
    for (const url of c.files) {
      const local = urlToLocal(url, repoRoot)
      if (local) owner.set(local, c.name)
    }
  }

  const violations: Violation[] = []
  for (const c of registry.components) {
    if (!isCopyPaste(c)) continue
    const declared = transitiveRegistryDeps(registry, c.name)
    for (const url of c.files) {
      const local = urlToLocal(url, repoRoot)
      if (!local || !/\.(ts|tsx)$/.test(local)) continue
      const src = readSource(local)
      if (src === null) continue
      for (const spec of parseRelativeImports(src)) {
        const target = resolveImportPath(local, spec, exists)
        if (!target) {
          violations.push({
            component: c.name,
            file: relative(repoRoot, local),
            spec,
            kind: 'unshipped',
          })
          continue
        }
        const ownerName = owner.get(target)
        if (!ownerName) {
          // Resolves on disk but no component ships it — won't reach a consumer.
          violations.push({
            component: c.name,
            file: relative(repoRoot, local),
            spec,
            kind: 'unshipped',
          })
          continue
        }
        if (ownerName !== c.name && !declared.has(ownerName)) {
          violations.push({
            component: c.name,
            file: relative(repoRoot, local),
            spec,
            kind: 'undeclared',
            owner: ownerName,
          })
        }
      }
    }
  }
  return violations
}
