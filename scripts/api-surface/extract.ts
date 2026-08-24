/**
 * Extracts the published type surface of the `1.x` packages from their built `.d.ts`.
 *
 * ## Why
 *
 * Every other invariant in this repo has a guard. The public API surface had none — which was
 * survivable while a minor was allowed to break (`docs/UPGRADING.md`, pre-1.0 column), and is
 * not once semver covers it. A dropped export, a prop that quietly became required, or a
 * narrowed union is a major-version event, and at 146 exports across 209 manifests it is not
 * something review reliably catches.
 *
 * So the surface is snapshotted to `api-surface.json` and compared on every CI run. A diff is
 * **not** a failure condition in itself — it is a prompt to classify the change as patch,
 * minor or major and record it in the changeset. The guard fails only when the committed
 * snapshot and the built `dist/` disagree, i.e. when a surface change reached `main` without
 * anyone looking at it.
 *
 * ## What it reads
 *
 * The built, rolled-up declarations an adopter actually installs — the same artifact
 * `dts-tsdoc-parity` reads, and for the same reason: the source is not what ships. Entry
 * points are derived from each package's `exports` map rather than hardcoded, so a new
 * subpath joins the snapshot automatically instead of silently escaping it.
 *
 * ## What it deliberately does not capture
 *
 * TSDoc comments (that is `dts-tsdoc-parity`'s job) and declaration order. Only names,
 * kinds, and normalized type text — the things `docs/UPGRADING.md` says semver covers.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Packages on the `1.x` line that emit type declarations (see docs/UPGRADING.md). */
export const COVERED_PACKAGES = [
  'react',
  'core',
  'charts',
  'editor',
  'flow',
  'i18n',
  'storage',
  'ai',
  'icons',
] as const

export interface EntrySurface {
  /** Exported names that carry a runtime value. */
  values: string[]
  /** Exported names that are types only. */
  types: string[]
  /** Normalized declaration text, keyed by exported name. */
  declarations: Record<string, string | Record<string, string>>
}

export type Snapshot = Record<string, Record<string, EntrySurface>>

interface PackageJson {
  name: string
  exports?: Record<string, unknown>
}

/** Strip block and line comments without touching string literals. */
function stripComments(source: string): string {
  let out = ''
  let i = 0
  let quote: string | null = null
  while (i < source.length) {
    const c = source[i]!
    const next = source[i + 1]
    if (quote !== null) {
      out += c
      if (c === '\\') {
        out += source[i + 1] ?? ''
        i += 2
        continue
      }
      if (c === quote) quote = null
      i += 1
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      out += c
      i += 1
      continue
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 2
      out += ' '
      continue
    }
    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i)
      i = end === -1 ? source.length : end
      continue
    }
    out += c
    i += 1
  }
  return out
}

/** Collapse whitespace so a reformat is not a surface change. */
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Read the balanced `{ … }` block starting at `open`, returning its inner text and the index
 * just past the closing brace. Brace-aware rather than `\n}`-anchored: member types are
 * routinely object literals, and a nested closing brace does land in column 0 in this
 * generated output (see `themePreloadScript` in `@cascivo/core`).
 */
function readBlock(source: string, open: number): { body: string; end: number } | null {
  if (source[open] !== '{') return null
  let depth = 0
  let quote: string | null = null
  for (let i = open; i < source.length; i += 1) {
    const c = source[i]!
    if (quote !== null) {
      if (c === '\\') {
        i += 1
        continue
      }
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    if (c === '{') depth += 1
    else if (c === '}') {
      depth -= 1
      if (depth === 0) return { body: source.slice(open + 1, i), end: i + 1 }
    }
  }
  return null
}

/** Split an interface body into top-level members, respecting nesting. */
function splitMembers(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  let quote: string | null = null
  for (let i = 0; i < body.length; i += 1) {
    const c = body[i]!
    if (quote !== null) {
      current += c
      if (c === '\\') {
        current += body[i + 1] ?? ''
        i += 1
        continue
      }
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      current += c
      continue
    }
    // `=>` is not a generic close. Counting its `>` drops depth below the real nesting and
    // swallows every following member into the arrow's return type — which is exactly what
    // happened to CommandMenuProps.
    if (c === '=' && body[i + 1] === '>') {
      current += '=>'
      i += 1
      continue
    }
    if (c === '{' || c === '(' || c === '[' || c === '<') depth += 1
    if (c === '}' || c === ')' || c === ']' || c === '>') depth -= 1
    if ((c === ';' || c === ',' || c === '\n') && depth === 0) {
      if (normalize(current) !== '') parts.push(normalize(current))
      current = ''
      continue
    }
    current += c
  }
  if (normalize(current) !== '') parts.push(normalize(current))
  return parts
}

/** `variant?: 'a' | 'b'` → key `variant?`, value `'a' | 'b'`. */
function memberEntry(member: string): [string, string] | null {
  // A call/construct/index signature has no simple name; keep it whole under its own key.
  if (/^(\(|new\s|\[)/.test(member)) return [member, '']
  const m = /^(readonly\s+)?([A-Za-z_$][\w$]*|'[^']*'|"[^"]*")(\?)?\s*(:|\()/.exec(member)
  if (m === null) return [member, '']
  const name = `${m[1] ?? ''}${m[2]}${m[3] ?? ''}`
  const rest = member.slice(m[0].length - 1)
  return [normalize(name), normalize(rest.replace(/^:/, ''))]
}

function entryPointsOf(pkg: PackageJson): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [subpath, value] of Object.entries(pkg.exports ?? {})) {
    if (typeof value === 'string') {
      if (/\.d\.[cm]?ts$/.test(value)) out[subpath] = value
      continue
    }
    if (value === null || typeof value !== 'object') continue
    const v = value as Record<string, unknown>
    const candidates = [
      v.types,
      (v.import as Record<string, unknown>)?.types,
      (v.default as Record<string, unknown>)?.types,
    ]
    const found = candidates.find((c): c is string => typeof c === 'string')
    if (found !== undefined) out[subpath] = found
  }
  return out
}

interface Specifier {
  /** The name an adopter imports. */
  exported: string
  /** The name declared locally, which may differ (`X as Y`). */
  local: string
  isType: boolean
  /** Set when the export re-exports straight from another module. */
  from?: string
}

/**
 * Parse every `export { … }` / `export type { … }` statement into specifiers.
 *
 * Four forms appear in this generated output and all of them matter:
 *   export { A, type B }                     — local declarations
 *   export type { C }                        — whole statement is types
 *   export { D as E }                        — the adopter imports E
 *   export { F } from '@cascivo/core'        — re-export, no local declaration
 */
function exportSpecifiers(source: string): Specifier[] {
  const specs: Specifier[] = []
  for (const m of source.matchAll(/(?:^|\n)export\s+(type\s+)?\{/g)) {
    const braceAt = source.indexOf('{', m.index)
    const block = readBlock(source, braceAt)
    if (block === null) continue
    const statementIsType = m[1] !== undefined
    const tail = source.slice(block.end, block.end + 200)
    const fromMatch = /^\s*from\s*['"]([^'"]+)['"]/.exec(tail)
    for (const raw of block.body.split(',')) {
      const spec = normalize(raw)
      if (spec === '') continue
      const isType = statementIsType || /^type\s/.test(spec)
      const withoutType = normalize(spec.replace(/^type\s+/, ''))
      const parts = withoutType.split(/\s+as\s+/)
      const local = normalize(parts[0] ?? withoutType)
      const exported = normalize(parts[parts.length - 1] ?? withoutType)
      if (exported === '' || local === '') continue
      const entry: Specifier = { exported, local, isType }
      if (fromMatch !== null) entry.from = fromMatch[1]!
      specs.push(entry)
    }
  }
  return specs
}

/**
 * Map a locally-imported name back to the module it came from, so a name that is imported
 * and then re-exported still records something a diff can catch. `@cascivo/storage` is the
 * whole reason: six of its seven exports originate in `@cascivo/core`.
 */
function importOrigins(source: string): Map<string, string> {
  const origins = new Map<string, string>()
  for (const m of source.matchAll(/(?:^|\n)import\s+(type\s+)?\{/g)) {
    const braceAt = source.indexOf('{', m.index)
    const block = readBlock(source, braceAt)
    if (block === null) continue
    const tail = source.slice(block.end, block.end + 200)
    const fromMatch = /^\s*from\s*['"]([^'"]+)['"]/.exec(tail)
    if (fromMatch === null) continue
    for (const raw of block.body.split(',')) {
      const spec = normalize(raw.replace(/^type\s+/, ''))
      if (spec === '') continue
      const parts = spec.split(/\s+as\s+/)
      const localName = normalize(parts[parts.length - 1] ?? spec)
      if (localName !== '') origins.set(localName, fromMatch[1]!)
    }
  }
  return origins
}

/**
 * Scan from `start` to the `;` that ends a declaration, ignoring any `;` nested inside braces,
 * parens, brackets or generics.
 *
 * Stopping at the first `;` followed by a newline is NOT enough. A multi-line type alias whose
 * branches are object literals ends every member with `;` in the middle of the declaration, so
 * that rule truncated `SideNavSubItem` after its first branch and dropped the rest of the union
 * from the snapshot — meaning deleting a branch produced no diff, the exact failure this guard
 * exists to catch. Sixteen of ninety-five aliases were recorded short.
 */
function declarationEnd(source: string, start: number): number {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < source.length; i += 1) {
    const c = source[i]!
    if (quote !== null) {
      if (c === '\\') {
        i += 1
        continue
      }
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    // `=>` is not a generic close — the same correction splitMembers needs.
    if (c === '=' && source[i + 1] === '>') {
      i += 1
      continue
    }
    if (c === '{' || c === '(' || c === '[' || c === '<') depth += 1
    else if (c === '}' || c === ')' || c === ']' || c === '>') depth -= 1
    else if (c === ';' && depth <= 0) return i
  }
  return -1
}

interface Declaration {
  /** 'type' for interfaces and aliases, 'value' for runtime bindings. */
  kind: 'type' | 'value'
  text: string | Record<string, string>
}

/**
 * Capture the declaration of `name`, normalized, and say whether it is a type or a value.
 *
 * The kind comes from the declaration, not from the `type` modifier on the export
 * specifier: `@cascivo/charts` re-exports 243 names with no modifiers at all, so trusting
 * the modifier classified `AggOp` and `SparklineProps` as runtime values.
 */
function declarationOf(source: string, name: string): Declaration | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const iface = new RegExp(`(?:^|\\n)(?:declare\\s+)?interface\\s+${escaped}\\b([^{]*)\\{`).exec(
    source,
  )
  if (iface !== null) {
    const block = readBlock(source, source.indexOf('{', iface.index + iface[0].length - 1))
    if (block !== null) {
      const members: Record<string, string> = {}
      const heritage = normalize(iface[1] ?? '')
      if (heritage !== '') members['(extends)'] = heritage
      for (const member of splitMembers(block.body)) {
        const entry = memberEntry(member)
        if (entry !== null) members[entry[0]] = entry[1]
      }
      return { kind: 'type', text: members }
    }
  }

  const alias = new RegExp(`(?:^|\\n)(?:declare\\s+)?type\\s+${escaped}\\b([^=]*)=`).exec(source)
  if (alias !== null) {
    const bodyStart = alias.index + alias[0].length
    const end = declarationEnd(source, bodyStart)
    const body = source.slice(bodyStart, end === -1 ? source.length : end)
    return { kind: 'type', text: normalize(`type${alias[1]} = ${body}`) }
  }

  const decl = new RegExp(
    `(?:^|\\n)declare\\s+(const|let|var|function|class|enum|namespace)\\s+${escaped}\\b`,
  ).exec(source)
  if (decl !== null) {
    const start = decl.index + (decl[0].startsWith('\n') ? 1 : 0)
    const kind = decl[1]!
    if (kind === 'class' || kind === 'enum' || kind === 'namespace') {
      const brace = source.indexOf('{', start)
      const block = brace === -1 ? null : readBlock(source, brace)
      if (block !== null) {
        const members: Record<string, string> = {}
        for (const member of splitMembers(block.body)) {
          const entry = memberEntry(member)
          if (entry !== null) members[entry[0]] = entry[1]
        }
        members['(kind)'] = kind
        return { kind: 'value', text: members }
      }
    }
    // const / function: take through the terminating semicolon at depth 0.
    const end = declarationEnd(source, start)
    if (end !== -1) return { kind: 'value', text: normalize(source.slice(start, end)) }
  }
  return null
}

export function buildSnapshot(repoRoot: string): Snapshot {
  const snapshot: Snapshot = {}
  for (const dir of COVERED_PACKAGES) {
    const pkgPath = join(repoRoot, 'packages', dir, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson
    const entries: Record<string, EntrySurface> = {}
    for (const [subpath, rel] of Object.entries(entryPointsOf(pkg))) {
      const file = join(repoRoot, 'packages', dir, rel.replace(/^\.\//, ''))
      if (!existsSync(file)) continue
      const source = stripComments(readFileSync(file, 'utf8'))
      const specs = exportSpecifiers(source)
      const origins = importOrigins(source)

      const declarations: EntrySurface['declarations'] = {}
      const valueSet = new Set<string>()
      const typeSet = new Set<string>()
      for (const spec of [...specs].sort((a, b) => a.exported.localeCompare(b.exported))) {
        if (spec.exported in declarations) continue
        const found = declarationOf(source, spec.local)
        if (found !== null) {
          declarations[spec.exported] = found.text
          ;(found.kind === 'type' ? typeSet : valueSet).add(spec.exported)
          continue
        }
        // No local declaration: the name is re-exported. Record where it comes from, so
        // moving an export between packages still shows up as a surface change. Kind falls
        // back to the specifier's own modifier, the only signal available here.
        const from = spec.from ?? origins.get(spec.local)
        if (from !== undefined) {
          declarations[spec.exported] = `re-export ${spec.local} from "${from}"`
          ;(spec.isType ? typeSet : valueSet).add(spec.exported)
        }
      }
      entries[subpath] = {
        values: [...valueSet].sort(),
        types: [...typeSet].sort(),
        declarations,
      }
    }
    if (Object.keys(entries).length > 0) snapshot[pkg.name] = entries
  }
  return snapshot
}
