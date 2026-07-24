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
 * For the typedefs-parity check: map each OWN prop of `<propsTypeName>` whose
 * type is a **repo-declared named object with fields** to that type's name
 * (e.g. `columns` → `Column`, `sort` → `SortState`, `actions` → `ShellHeaderAction`).
 *
 * Unwraps `X[]` and `X | undefined`; a prop is included only when a single
 * object arm remains that (a) has ≥1 property and no call signature, (b) is named
 * (not an anonymous `{ … }` inline literal — those are already expanded in the
 * manifest's type string), and (c) is declared inside this repo (excludes
 * `ReactNode`, `CSSProperties`, `RefObject`, and every other node_modules type).
 * Returns `null` when the props type can't be resolved (same as `resolvePropSets`).
 */
export function resolveNamedObjectProps(
  tsxRelPaths: string[],
  propsTypeName: string,
): Map<string, string> | null {
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
    return namedObjectPropsFor(decl)
  }
  return null
}

function namedObjectPropsFor(
  decl: InterfaceDeclaration | TypeAliasDeclaration,
): Map<string, string> {
  const out = new Map<string, string>()
  const own = ownMembers(decl)
  const propsType = decl.getType()
  for (const name of own) {
    const sym = propsType.getProperty(name)
    if (!sym) continue
    const typeName = namedObjectTypeName(sym.getTypeAtLocation(decl))
    if (typeName) out.set(name, typeName)
  }
  return out
}

/** The repo-declared object type name for a prop type, or null. */
function namedObjectTypeName(rawType: import('ts-morph').Type): string | null {
  // Unwrap `X[]`.
  let t = rawType
  if (t.isArray()) {
    const el = t.getArrayElementType()
    if (!el) return null
    t = el
  }
  // Unwrap `X | undefined | null` down to a single non-nullish arm.
  if (t.isUnion()) {
    const arms = t.getUnionTypes().filter((a) => !a.isUndefined() && !a.isNull())
    if (arms.length !== 1) return null // multiple arms / literal unions → not a single object
    t = arms[0]!
    if (t.isArray()) {
      const el = t.getArrayElementType()
      if (!el) return null
      t = el
    }
  }
  if (!t.isObject() || t.isArray()) return null
  if (t.getCallSignatures().length > 0 || t.getConstructSignatures().length > 0) return null
  if (t.getProperties().length === 0) return null
  const sym = t.getAliasSymbol() ?? t.getSymbol()
  const name = sym?.getName()
  if (!name || name === '__type' || name === '__object') return null // anonymous inline literal
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) return null
  // i18n string bags are documented via the i18n system, not per-component typeDefs.
  if (name.endsWith('Labels')) return null
  const decls = sym?.getDeclarations() ?? []
  const inRepo = decls.some((d) => !d.getSourceFile().getFilePath().includes('node_modules'))
  if (!inRepo) return null // ReactNode, CSSProperties, RefObject, … live in node_modules
  return name
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
