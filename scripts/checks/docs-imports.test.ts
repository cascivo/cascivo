/**
 * Docs-imports check (layer 2 of the docs freshness invariant) — every `@cascivo/*`
 * import shown in a published guide's code block must resolve:
 *
 *   - the package is a real workspace package,
 *   - a subpath import (`@cascivo/themes/dark`, `@cascivo/react/styles.css`) is in
 *     that package's `exports` map, and
 *   - a bare named import (`import { X } from '@cascivo/react'`) names a symbol the
 *     package actually exports.
 *
 * This is the mechanical guard for the doc-drift class the 2026-07-18 TanStack Start
 * adopter hit (F3: a doc teaching `import { setLinkComponent } from '@cascivo/core'`
 * for prebuilt-package users who never install it — now re-exported from
 * `@cascivo/react`, WS-B). It scans the canonical guides (`docs/*.md`) plus the
 * generated `llms.txt` / `llms-full.txt` (the shipped machine-readable artifact).
 *
 * Scope is deliberately narrow to avoid false positives: `docs/internal/**`,
 * `docs/plans/**`, and `docs/cookbooks/**` are excluded (plans reference not-yet-built
 * APIs; cookbooks are illustrative narratives that reference private/example packages).
 */

import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { packageDirs, packageExports, resolvePackageExportNames } from './lib/package-exports.ts'

const REPO_ROOT = join(import.meta.dirname, '../..')
const DOCS_DIR = join(REPO_ROOT, 'docs')
const PUBLIC_DIR = join(REPO_ROOT, 'apps/site/public')

/**
 * Genuinely-intentional divergences. Key: `<file>::<spec>` or `<spec>`. Value: reason.
 * Kept honest by the stale-entry test below.
 */
const ALLOWLIST: Record<string, string> = {
  // (none currently)
}

/** Named-import symbols that are types/values a resolver may legitimately miss. */
const NAME_ALLOWLIST = new Set<string>([])

interface DocImport {
  file: string
  spec: string // e.g. '@cascivo/react' or '@cascivo/themes/dark'
  names: string[] // named imports, empty for side-effect / default-only
}

/** Extract `@cascivo/*` imports from fenced code blocks in a markdown/plain file. */
function extractCascivoImports(file: string, text: string): DocImport[] {
  const out: DocImport[] = []
  // Only look inside fenced code blocks so prose mentions don't count.
  const blocks: string[] = []
  const fence = /```[^\n]*\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = fence.exec(text)) !== null) blocks.push(m[1]!)
  // llms.txt is not fenced throughout; also scan raw import lines there.
  const haystack = file.endsWith('.txt') ? [text] : blocks

  for (const block of haystack) {
    // Named / default import: import { a, b } from '@cascivo/pkg'
    for (const im of block.matchAll(
      /import\s+(?:type\s+)?(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s+['"](@cascivo\/[^'"]+)['"]/g,
    )) {
      const names = (im[2] ?? '')
        .split(',')
        .map((s) =>
          s
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]!
            .trim(),
        )
        .filter(Boolean)
      out.push({ file, spec: im[3]!, names })
    }
    // Side-effect import: import '@cascivo/themes/all'
    for (const im of block.matchAll(/import\s+['"](@cascivo\/[^'"]+)['"]/g)) {
      out.push({ file, spec: im[1]!, names: [] })
    }
  }
  return out
}

/** Split '@cascivo/pkg/sub/path' → ['@cascivo/pkg', './sub/path' | null]. */
function splitSpec(spec: string): { pkg: string; subpath: string | null } {
  const parts = spec.split('/')
  const pkg = `${parts[0]}/${parts[1]}`
  const rest = parts.slice(2).join('/')
  return { pkg, subpath: rest ? `./${rest}` : null }
}

/** Placeholder specs (`@cascivo/themes/<name>`, `.../ *`) are templates, not literal. */
function isPlaceholder(spec: string): boolean {
  return /[<>*]/.test(spec)
}

/** Recursively collect `*.md` files under `dir` (used for the per-entry llms/context docs). */
function collectMdFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...collectMdFiles(full))
    else if (entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

function collectDocFiles(): string[] {
  const files: string[] = []
  // Top-level guides only (exclude internal/, plans/, cookbooks/).
  for (const entry of readdirSync(DOCS_DIR)) {
    if (entry.endsWith('.md')) files.push(join(DOCS_DIR, entry))
  }
  // Generated machine-readable artifacts (the shipped surface).
  for (const gen of ['llms.txt', 'llms-full.txt']) {
    const p = join(PUBLIC_DIR, gen)
    if (existsSync(p)) files.push(p)
  }
  // Per-entry machine-readable docs (llms/<name>.md, context/<name>.md). These
  // are shipped too, and were previously only covered via the llms-full.txt
  // roll-up — a bad import in a single entry doc (e.g. a phantom
  // `@cascivo/layout/…` package import) would otherwise be invisible.
  files.push(...collectMdFiles(join(PUBLIC_DIR, 'llms')))
  files.push(...collectMdFiles(join(PUBLIC_DIR, 'context')))
  return files
}

describe('docs-imports — every @cascivo import in the guides resolves', () => {
  const dirs = packageDirs()
  const imports = collectDocFiles().flatMap((f) =>
    extractCascivoImports(f, readFileSync(f, 'utf8')),
  )

  it('collects a plausible number of imports (guards against a broken scanner)', () => {
    assert.ok(
      imports.length > 20,
      `only ${imports.length} @cascivo imports found — scanner broken?`,
    )
  })

  it('every imported package is a real workspace package', () => {
    const bad: string[] = []
    for (const im of imports) {
      if (isPlaceholder(im.spec)) continue
      const { pkg } = splitSpec(im.spec)
      if (ALLOWLIST[im.spec] || ALLOWLIST[`${im.file}::${im.spec}`]) continue
      if (!dirs.has(pkg)) bad.push(`${rel(im.file)}: '${im.spec}' → unknown package ${pkg}`)
    }
    assert.deepEqual(bad, [], `Docs import unknown @cascivo packages:\n  ${bad.join('\n  ')}`)
  })

  it('every subpath import is in the package exports map', () => {
    const bad: string[] = []
    for (const im of imports) {
      if (isPlaceholder(im.spec)) continue
      const { pkg, subpath } = splitSpec(im.spec)
      if (!subpath || !dirs.has(pkg)) continue
      if (ALLOWLIST[im.spec] || ALLOWLIST[`${im.file}::${im.spec}`]) continue
      const exp = packageExports(pkg)
      if (exp && exp[subpath] === undefined) {
        bad.push(`${rel(im.file)}: '${im.spec}' → ${subpath} not in ${pkg} exports`)
      }
    }
    assert.deepEqual(bad, [], `Docs import subpaths not in the exports map:\n  ${bad.join('\n  ')}`)
  })

  it('every bare named import names a real export', () => {
    const bad: string[] = []
    for (const im of imports) {
      if (isPlaceholder(im.spec) || im.names.length === 0) continue
      const { pkg, subpath } = splitSpec(im.spec)
      if (subpath || !dirs.has(pkg)) continue // subpath name-resolution handled elsewhere
      const exported = resolvePackageExportNames(pkg)
      if (exported.size === 0) continue // unresolvable entry — don't false-positive
      for (const name of im.names) {
        if (NAME_ALLOWLIST.has(name)) continue
        if (ALLOWLIST[`${im.file}::${im.spec}`]) continue
        if (!exported.has(name)) {
          bad.push(`${rel(im.file)}: '${name}' is not exported by ${pkg}`)
        }
      }
    }
    assert.deepEqual(bad, [], `Docs import symbols that don't exist:\n  ${bad.join('\n  ')}`)
  })

  it('theme CSS imports use the `.css`-suffixed specifier (TS2882-safe)', () => {
    // `@cascivo/themes/all` (extensionless) resolves to a .css file, which fails
    // TS2882 under `noUncheckedSideEffectImports` (the TanStack Start scaffold's
    // default). The `.css` twin works in every bundler and tsconfig, so all docs
    // must use it. Enforce the form on theme side-effect imports.
    const bad: string[] = []
    for (const im of imports) {
      if (im.names.length > 0) continue // side-effect imports only
      const { pkg } = splitSpec(im.spec)
      if (pkg !== '@cascivo/themes') continue
      if (isPlaceholder(im.spec)) continue
      if (!im.spec.endsWith('.css')) {
        bad.push(`${rel(im.file)}: '${im.spec}' → use the .css form ('${im.spec}.css')`)
      }
    }
    assert.deepEqual(
      bad,
      [],
      `Theme CSS imports must use the .css-suffixed specifier (TS2882-safe):\n  ${bad.join('\n  ')}`,
    )
  })

  it('allowlist has no stale entries', () => {
    const specs = new Set(imports.map((i) => i.spec))
    const fileSpecs = new Set(imports.map((i) => `${i.file}::${i.spec}`))
    const stale = Object.keys(ALLOWLIST).filter(
      (k) =>
        !specs.has(k) && !fileSpecs.has(k) && ![...fileSpecs].some((f) => f.endsWith(`::${k}`)),
    )
    assert.deepEqual(stale, [], `Stale ALLOWLIST entries — remove:\n  ${stale.join('\n  ')}`)
  })
})

function rel(file: string): string {
  return file.startsWith(REPO_ROOT) ? file.slice(REPO_ROOT.length + 1) : file
}
