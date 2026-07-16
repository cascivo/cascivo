/**
 * Type-aware component prop resolver for the props-parity check.
 *
 * A text heuristic can't tell an inherited/spread HTML attribute
 * (`...ButtonHTMLAttributes`) from a documented-but-missing prop, nor a
 * component's own props from an internal helper interface in the same file. This
 * uses ts-morph (which bundles its own TypeScript) to answer both precisely:
 *
 *   - `declaredOwn`  — members declared DIRECTLY on the props type (excluding
 *     `extends`/spread). The set an author is expected to document.
 *   - `resolvedAll`  — the full property set including inherited/spread members.
 *     Answers "does this prop exist at all?", killing HTML-passthrough false
 *     positives (`onClick`, `checked`, `href`, …).
 */

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type InterfaceDeclaration, Node, Project, ts, type TypeAliasDeclaration } from 'ts-morph'

const REPO_ROOT = fileURLToPath(new URL('../../..', import.meta.url))

export interface PropSets {
  /** Members declared directly on the props type (excludes inherited/spread). */
  declaredOwn: Set<string>
  /** Full property set incl. inherited/spread (via the type checker). */
  resolvedAll: Set<string>
}

let cached: Project | null = null

/**
 * A single shared project. Component sources are added on demand; the checker
 * resolves React and @cascivo/* types via node_modules + these path aliases.
 */
function getProject(): Project {
  if (cached) return cached
  cached = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      strict: true,
      skipLibCheck: true,
      baseUrl: REPO_ROOT,
      paths: {
        // Source aliases so imports inside the component resolve without dist.
        '@cascivo/core': ['packages/core/src/index.ts'],
        '@cascivo/i18n': ['packages/i18n/src/index.ts'],
        '@cascivo/storage': ['packages/storage/src/index.ts'],
        '@cascivo/icons': ['packages/icons/src/index.tsx'],
      },
    },
  })
  return cached
}

/** A string-literal property name (`'aria-label'`) is written with quotes in the
 * syntax tree but is unquoted by the checker and in the manifest — normalize. */
function unquote(name: string): string {
  return name.replace(/^(['"])(.*)\1$/, '$2')
}

/** Own members declared directly on an interface or object-literal type alias. */
function ownMembers(decl: InterfaceDeclaration | TypeAliasDeclaration): Set<string> {
  const names = new Set<string>()
  if (Node.isInterfaceDeclaration(decl)) {
    // getProperties() returns own members only — `extends` clauses excluded.
    for (const p of decl.getProperties()) names.add(unquote(p.getName()))
    return names
  }
  // Type alias: take members from object-literal arms only. For an intersection
  // `A & { … }` that means the inline `{ … }`, not the extended type `A`.
  const typeNode = decl.getTypeNode()
  const literals = typeNode
    ? Node.isIntersectionTypeNode(typeNode)
      ? typeNode.getTypeNodes()
      : [typeNode]
    : []
  for (const node of literals) {
    if (Node.isTypeLiteral(node)) {
      for (const p of node.getProperties()) names.add(unquote(p.getName()))
    }
  }
  return names
}

/**
 * Resolve the two prop sets for `<propsTypeName>` (e.g. `ButtonProps`) exported
 * from one of the component's `.tsx` files. Returns `null` when no exported type
 * of that name is found in any of the candidate files (component documents props
 * inline, or has no props interface) — the caller skips those.
 */
export function resolvePropSets(tsxRelPaths: string[], propsTypeName: string): PropSets | null {
  const project = getProject()
  for (const rel of tsxRelPaths) {
    const abs = join(REPO_ROOT, rel)
    let sf = project.getSourceFile(abs)
    if (!sf) {
      try {
        sf = project.addSourceFileAtPath(abs)
      } catch {
        continue
      }
    }
    const iface = sf.getInterface(propsTypeName)
    const alias = sf.getTypeAlias(propsTypeName)
    const decl = iface?.isExported() ? iface : alias?.isExported() ? alias : undefined
    if (!decl) continue

    return propSetsFor(decl)
  }
  return null
}

function propSetsFor(decl: InterfaceDeclaration | TypeAliasDeclaration): PropSets {
  const declaredOwn = ownMembers(decl)
  const resolvedAll = new Set<string>()
  for (const p of decl.getType().getProperties()) resolvedAll.add(unquote(p.getName()))
  return { declaredOwn, resolvedAll }
}

/**
 * Test-only: resolve prop sets from an in-memory source string. Used by the
 * seeded mutation test to exercise the directional logic without a fixture file.
 */
export function resolvePropSetsFromSource(source: string, propsTypeName: string): PropSets | null {
  const project = getProject()
  const sf = project.createSourceFile(join(REPO_ROOT, '__props_parity_virtual__.tsx'), source, {
    overwrite: true,
  })
  const iface = sf.getInterface(propsTypeName)
  const alias = sf.getTypeAlias(propsTypeName)
  const decl = iface?.isExported() ? iface : alias?.isExported() ? alias : undefined
  const result = decl ? propSetsFor(decl) : null
  project.removeSourceFile(sf)
  return result
}
