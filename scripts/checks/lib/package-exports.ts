/**
 * Static export-name resolver for `@cascivo/*` packages, from TypeScript source
 * (no build required). Follows `export * from …` and `export { … } from …` across
 * the repo's file graph, and collects locally-declared `export`s. Used by
 * docs-imports.test.ts to verify that a `import { X } from '@cascivo/pkg'` in the
 * docs names a symbol the package actually exports.
 *
 * It is deliberately conservative: it resolves relative re-exports and cross-package
 * `@cascivo/*` re-exports (which is how `@cascivo/react` surfaces every component and
 * a slice of `@cascivo/core`), and it errs toward INCLUDING a name (an over-broad set
 * only lets a bad doc import slip through; it never fails a valid one).
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const REPO_ROOT = join(import.meta.dirname, '../../..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')

/** Map `@cascivo/<name>` → package directory, by scanning each package manifest. */
let pkgDirCache: Map<string, string> | null = null
export function packageDirs(): Map<string, string> {
  if (pkgDirCache) return pkgDirCache
  const map = new Map<string, string>()
  for (const dir of readdirSync(PACKAGES_DIR)) {
    const pj = join(PACKAGES_DIR, dir, 'package.json')
    try {
      const name = (JSON.parse(readFileSync(pj, 'utf8')) as { name?: string }).name
      if (name) map.set(name, join(PACKAGES_DIR, dir))
    } catch {
      // no package.json
    }
  }
  pkgDirCache = map
  return map
}

/** The `exports` map of a package, or null if it has none / isn't a workspace pkg. */
export function packageExports(pkgName: string): Record<string, unknown> | null {
  const dir = packageDirs().get(pkgName)
  if (!dir) return null
  try {
    const pj = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>
    }
    return pj.exports ?? null
  } catch {
    return null
  }
}

/** Try a set of candidate file paths for a module specifier, returning the first hit. */
function resolveModuleFile(fromFile: string, spec: string): string | null {
  if (spec.startsWith('.')) {
    const base = resolve(dirname(fromFile), spec)
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.mts`,
      join(base, 'index.ts'),
      join(base, 'index.tsx'),
      join(base, 'index.mts'),
    ]
    return candidates.find((c) => existsSync(c) && !isDir(c)) ?? null
  }
  const cascivo = /^(@cascivo\/[^/]+)$/.exec(spec)
  if (cascivo) {
    const dir = packageDirs().get(cascivo[1])
    if (!dir) return null
    for (const cand of ['src/index.ts', 'src/index.tsx', 'src/index.mts']) {
      const p = join(dir, cand)
      if (existsSync(p)) return p
    }
  }
  return null // external (react, etc.) — not resolvable, not needed
}

function isDir(p: string): boolean {
  try {
    return readdirSync(p).length >= 0
  } catch {
    return false
  }
}

/** Collect exported identifier names from a source file, following re-exports. */
function collectFromFile(file: string, seen: Set<string>): Set<string> {
  const names = new Set<string>()
  if (seen.has(file)) return names
  seen.add(file)
  const src = readFileSync(file, 'utf8')

  // export * from './x'  /  export * from '@cascivo/pkg'
  for (const m of src.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveModuleFile(file, m[1]!)
    if (target) for (const n of collectFromFile(target, seen)) names.add(n)
  }
  // export * as NS from '...'
  for (const m of src.matchAll(/export\s+\*\s+as\s+(\w+)\s+from/g)) names.add(m[1]!)

  // export { a, b as c, type D } from '...'  and  export { a, b as c }
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?:\s+from\s+['"][^'"]+['"])?/g)) {
    for (const raw of m[1]!.split(',')) {
      const part = raw.trim().replace(/^type\s+/, '')
      if (!part) continue
      const asMatch = /\bas\s+(\w+)\s*$/.exec(part)
      names.add(asMatch ? asMatch[1]! : part.split(/\s+/)[0]!)
    }
  }

  // Locally-declared exports: function/const/let/var/class/interface/type/enum/namespace.
  for (const m of src.matchAll(
    /export\s+(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function|const|let|var|class|interface|type|enum|namespace)\s+(\w+)/g,
  )) {
    names.add(m[1]!)
  }
  if (/export\s+default\b/.test(src)) names.add('default')

  return names
}

const exportCache = new Map<string, Set<string>>()

/** The set of names `@cascivo/<pkgName>` exports from its bare (`.`) entry. */
export function resolvePackageExportNames(pkgName: string): Set<string> {
  const cached = exportCache.get(pkgName)
  if (cached) return cached
  const dir = packageDirs().get(pkgName)
  let names = new Set<string>()
  if (dir) {
    const entry = ['src/index.ts', 'src/index.tsx', 'src/index.mts']
      .map((c) => join(dir, c))
      .find((p) => existsSync(p))
    if (entry) names = collectFromFile(entry, new Set())
  }
  exportCache.set(pkgName, names)
  return names
}
