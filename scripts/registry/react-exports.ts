/**
 * The set of names `@cascivo/react` actually exports — resolved from source, not guessed.
 *
 * Two consumers, one reason:
 *
 * 1. `scripts/checks/path-b-parity.test.ts` — asserts every primitive the reactivity docs
 *    name is importable on the prebuilt path.
 * 2. `scripts/llms/generate.ts` — decides each registry entry's distribution channel.
 *    That decision used to be inferred from a **source path** ("under packages/components/src
 *    → npm; under packages/layouts/src → copy-paste only"), which was wrong for the six
 *    layout primitives `@cascivo/react` does export: every generated AI surface told agents
 *    that `Flex`, `Grid`, `GridItem`, `Columns`, `Center`, `Spacer` and `AutoGrid` were
 *    "copy-paste only — not published as an importable package", while the hand-written
 *    dashboard recipe correctly said the opposite. An inference that is right for 186
 *    entries and wrong for 6 reads as correct in review; only deriving it from the real
 *    export list makes it checkable.
 *
 * Resolution: parse `packages/react/src/index.ts`, take every named export, and follow each
 * relative `export * from './x'` into that module to collect its top-level export names.
 * Source-based (not `dist/`) so this works on a cold tree, where `pnpm regen` runs before
 * any build.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/** Remove comments so a `// heading` inside an export block can't be read as a name. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/** Names in `export { a, b as c, type D }` / `export type { E }` blocks. */
function namedExports(src: string): string[] {
  const out: string[] = []
  for (const block of src.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (const raw of block[1]!.split(',')) {
      const name = raw
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
      if (name) out.push(name.trim())
    }
  }
  return out
}

/** Names in `export function f` / `export const c` / `export class C` / `export interface I`. */
function declarationExports(src: string): string[] {
  return [
    ...src.matchAll(
      /export\s+(?:declare\s+)?(?:function|const|let|class|interface|type|enum)\s+(\w+)/g,
    ),
  ].map((m) => m[1]!)
}

/** Resolve a relative specifier to a real file, trying the usual extensions. */
function resolveModule(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec)
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) return candidate
  }
  return null
}

/**
 * Every identifier importable from `@cascivo/react`, values and types alike.
 * `depth` bounds the `export *` walk; one level of indirection is all the entry uses.
 */
/**
 * Top-level export names declared in one source file.
 *
 * Used to decide an entry's distribution channel by its **symbols** rather than by its
 * display name. `toast`'s display name is `Toast`, which `@cascivo/react` does not export —
 * but `ToastProvider`, `useToast` and `dismissAllToasts` are all exported and are the entire
 * usable API. Testing the name alone labelled the whole entry "copy-paste only", and the
 * recipe's channel column — which an adopter explicitly trusted *because* it is CI-checked —
 * was wrong for it.
 */
export function exportedNamesOf(file: string): Set<string> {
  if (!existsSync(file)) return new Set()
  const src = stripComments(readFileSync(file, 'utf8'))
  return new Set([...namedExports(src), ...declarationExports(src)])
}

/**
 * The **source modules** `@cascivo/react` re-exports from, as repo-relative paths.
 *
 * Names alone cannot answer "is *this entry* on npm?" when two registry entries share a
 * display name. Two do: `app-shell` and `layout/app-shell` are both `AppShell`; `calendar`
 * and `chart/calendar` are both `Calendar`. Because `AppShell` is in the exported-name set,
 * a name-keyed lookup marked **both** entries npm-distributed, so the generated
 * `/llms/layout/app-shell.md` told adopters to
 * `import { AppShell } from '@cascivo/react'` — an import that silently gives them the
 * *other* component, with `nav` where they were told to write `sideNav`. Identity has to be
 * keyed on the file, which is unique per entry.
 */
export function reactExportedModules(repoRoot: string, depth = 2): Set<string> {
  const entry = join(repoRoot, 'packages/react/src/index.ts')
  const modules = new Set<string>()

  const visit = (file: string, remaining: number): void => {
    if (remaining <= 0) return
    const src = stripComments(readFileSync(file, 'utf8'))
    for (const spec of src.matchAll(/export\s*(?:\*|\{[^}]*\})\s*from\s*['"](\.[^'"]+)['"]/g)) {
      const target = resolveModule(file, spec[1]!)
      if (!target) continue
      modules.add(target.slice(repoRoot.length).replace(/^\/+/, ''))
      visit(target, remaining - 1)
    }
  }

  visit(entry, depth)
  return modules
}

export function reactExportedNames(repoRoot: string, depth = 2): Set<string> {
  const entry = join(repoRoot, 'packages/react/src/index.ts')
  const names = new Set<string>()

  const visit = (file: string, remaining: number): void => {
    const src = stripComments(readFileSync(file, 'utf8'))
    for (const name of [...namedExports(src), ...declarationExports(src)]) names.add(name)
    if (remaining <= 0) return
    for (const star of src.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)) {
      const target = resolveModule(file, star[1]!)
      if (target) visit(target, remaining - 1)
    }
  }

  visit(entry, depth)
  return names
}
