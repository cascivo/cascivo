/**
 * Prop TSDoc generator — the manifest's prose, delivered to the surface adopters read.
 *
 * ## Why this exists
 *
 * Two agents built the same dashboard on the same day against the same published version.
 * One read `llms.txt` and was saved by the ⚠ on `Flex`'s `direction` default; the other read
 * the shipped `packages/react/dist/index.d.ts` and was bitten by it three times in one build,
 * because the manifest's prose never reached the TypeScript declarations.
 *
 * That is a whole class of defect, not one bug: a fact gets corrected on the surface a guard
 * checks, the guard goes green, and the fix never reaches the surface the adopter actually
 * uses. 284 of the 373 props carrying a documented `default` had no TSDoc at all.
 *
 * ## What it does
 *
 * For every `*.meta.ts` prop that carries a `default` or a `⚠` warning, write (or refresh) a
 * TSDoc block above the matching member of the component's `…Props` interface. The manifest
 * stays the single owner of the fact — this only republishes it onto the type surface, the
 * same way `registry.json` and `llms/*.md` republish it onto the machine surface.
 *
 * Rules that keep it safe to run on every `pnpm regen`:
 *   - **Never overwrite a longer hand-written block.** Several props already carry richer
 *     prose than the manifest (`CardHeader.actions`, `ChartFrame.width`); those win.
 *   - **Idempotent.** Regenerating produces a byte-identical file, so the drift check passes.
 *   - **Only `…Props` interfaces**, only props the manifest documents.
 *
 * Run with: `pnpm tsdoc:generate` (part of `pnpm regen`).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))

const SOURCE_DIRS = [
  join(REPO_ROOT, 'packages/components/src'),
  join(REPO_ROOT, 'packages/layouts/src'),
  join(REPO_ROOT, 'packages/charts/src/charts'),
]

/** Marker so a generated block can be recognised and refreshed rather than duplicated. */
const MARKER = '@see the component manifest'

interface MetaProp {
  name: string
  description?: string
  default?: string
}

/**
 * Extract `{ name, description, default }` from a `.meta.ts`'s `props: [...]` array.
 *
 * Deliberately a text scan rather than an import: this runs before any build, on a cold
 * tree, and must not execute component modules.
 */
function parseMetaProps(source: string): MetaProp[] {
  const start = source.search(/\n\s*props:\s*\[/)
  if (start === -1) return []
  const from = source.indexOf('[', start)
  let depth = 0
  let end = from
  for (let i = from; i < source.length; i++) {
    const ch = source[i]
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  const block = source.slice(from + 1, end)

  const props: MetaProp[] = []
  // Split on top-level `{ … }` entries.
  let entryDepth = 0
  let entryStart = -1
  for (let i = 0; i < block.length; i++) {
    const ch = block[i]
    if (ch === '{') {
      if (entryDepth === 0) entryStart = i
      entryDepth++
    } else if (ch === '}') {
      entryDepth--
      if (entryDepth === 0 && entryStart !== -1) {
        const entry = block.slice(entryStart, i + 1)
        const name = /name:\s*'([^']+)'/.exec(entry)?.[1]
        if (name) {
          props.push({
            name,
            ...(readStringField(entry, 'description') !== undefined
              ? { description: readStringField(entry, 'description')! }
              : {}),
            ...(readStringField(entry, 'default') !== undefined
              ? { default: readStringField(entry, 'default')! }
              : {}),
          })
        }
        entryStart = -1
      }
    }
  }
  return props
}

/** Read a single-quoted string field, joining the `'a' + 'b'` and multi-line forms. */
function readStringField(entry: string, field: string): string | undefined {
  const at = entry.search(new RegExp(`\\b${field}:\\s*`))
  if (at === -1) return undefined
  const rest = entry.slice(at + entry.slice(at).indexOf(':') + 1)
  const parts: string[] = []
  let i = 0
  while (i < rest.length) {
    const ch = rest[i]
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '+') {
      i++
      continue
    }
    if (ch !== "'") break
    let out = ''
    i++
    while (i < rest.length && rest[i] !== "'") {
      if (rest[i] === '\\') {
        out += rest[i + 1] === "'" ? "'" : rest[i]! + rest[i + 1]!
        i += 2
        continue
      }
      out += rest[i]
      i++
    }
    i++ // closing quote
    parts.push(out)
  }
  // A present-but-empty value is meaningful (`Avatar.alt` defaults to `''`), so only an
  // absent field returns undefined.
  return parts.length === 0 ? undefined : parts.join('')
}

/** Wrap prose into a TSDoc block at the given indentation. */
function tsdocBlock(prop: MetaProp, indent: string): string {
  const words = (prop.description ?? '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (line && `${line} ${word}`.length > 88) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  if (prop.default !== undefined) {
    lines.push('')
    lines.push(`@defaultValue \`${prop.default}\``)
  }
  lines.push(MARKER)

  if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`
  return (
    `${indent}/**\n` +
    lines.map((l) => (l ? `${indent} * ${l}` : `${indent} *`)).join('\n') +
    `\n${indent} */\n`
  )
}

/**
 * Insert or refresh the TSDoc for each documented prop in one source file.
 * Returns the new source, or null when nothing changed.
 *
 * Line-based on purpose: an offset-based splice has to reason about where a comment block's
 * own indentation starts versus where the member's does, and getting that wrong grows the
 * indentation on every run instead of converging.
 */
function applyTsdoc(source: string, props: MetaProp[]): string | null {
  let lines = source.split('\n')

  for (const prop of props) {
    // Only props with a default or a warning: the two things an adopter is bitten by and
    // cannot infer from the type. Descriptions alone would churn every file for little gain.
    const hasWarning = (prop.description ?? '').includes('⚠')
    if (prop.default === undefined && !hasWarning) continue
    if (!prop.description) continue

    const memberRe = new RegExp(`^([ \\t]+)${escapeRe(prop.name)}\\?\\s*:`)
    const memberLine = lines.findIndex((l) => memberRe.test(l))
    if (memberLine === -1) continue
    const indent = memberRe.exec(lines[memberLine]!)![1]!

    // Walk back over a contiguous comment block directly above the member.
    let blockStart = memberLine
    if (lines[memberLine - 1]?.trimStart().startsWith('*/')) {
      let i = memberLine - 1
      while (i >= 0 && !lines[i]!.trimStart().startsWith('/**')) i--
      if (i >= 0) blockStart = i
    } else if (lines[memberLine - 1]?.trimStart().startsWith('/**')) {
      blockStart = memberLine - 1 // single-line /** … */
    }

    const existing = blockStart === memberLine ? null : lines.slice(blockStart, memberLine)
    const block = tsdocBlock(prop, indent).replace(/\n$/, '').split('\n')

    if (existing) {
      const text = existing.join('\n')
      // A hand-written block that says more than the manifest is authoritative — several
      // props already carry richer prose than their manifest entry.
      if (!text.includes(MARKER) && text.length >= block.join('\n').length) continue
      lines = [...lines.slice(0, blockStart), ...block, ...lines.slice(memberLine)]
    } else {
      lines = [...lines.slice(0, memberLine), ...block, ...lines.slice(memberLine)]
    }
  }

  const out = lines.join('\n')
  return out === source ? null : out
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

let written = 0
let scanned = 0
for (const dir of SOURCE_DIRS) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const metaPath = join(dir, entry.name, `${entry.name}.meta.ts`)
    const tsxPath = join(dir, entry.name, `${entry.name}.tsx`)
    let meta: string
    let tsx: string
    try {
      meta = readFileSync(metaPath, 'utf8')
      tsx = readFileSync(tsxPath, 'utf8')
    } catch {
      continue
    }
    scanned++
    const next = applyTsdoc(tsx, parseMetaProps(meta))
    if (next !== null) {
      writeFileSync(tsxPath, next)
      written++
    }
  }
}

console.log(`tsdoc: ${written} component(s) updated of ${scanned} scanned`)
