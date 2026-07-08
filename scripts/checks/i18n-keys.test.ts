/**
 * i18n builtin key-coverage check.
 *
 * Statically scans every `builtin.<namespace>.<key>` reference under packages/
 * and asserts the key actually exists in the `builtin` catalog object in
 * packages/i18n/src/builtin.ts. Catches the bug class behind the dashboard
 * feedback: a component ships referencing a catalog key that an older
 * published @cascivo/i18n build doesn't have (t(undefined) at runtime).
 *
 * This does not catch drift against a specific *published npm* version — only
 * drift between components and the in-repo catalog. See standalone-smoke.ts
 * for the clean-room render check against an installed package.
 *
 * Run with: `pnpm i18n:check` (also runs in `regen`/CI).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const BUILTIN_PATH = join(REPO_ROOT, 'packages/i18n/src/builtin.ts')
const SCAN_ROOT = join(REPO_ROOT, 'packages')

/** Skip nested string-literal braces (e.g. 'Page {page} of {total}') by blanking string contents. */
function blankStrings(source: string): string {
  const out: string[] = Array.from({ length: source.length })
  let i = 0
  let inString: string | null = null
  while (i < source.length) {
    const ch = source[i] ?? ''
    if (inString) {
      if (ch === '\\' && i + 1 < source.length) {
        out[i] = ' '
        out[i + 1] = ' '
        i += 2
        continue
      }
      if (ch === inString) {
        out[i] = ch
        inString = null
        i++
        continue
      }
      out[i] = ch === '\n' ? '\n' : ' '
      i++
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch
      out[i] = ch
      i++
      continue
    }
    out[i] = ch
    i++
  }
  return out.join('')
}

/** Finds the index of the `}` matching the `{` at openIndex, skipping string-literal contents. */
function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0
  let i = openIndex
  let inString: string | null = null
  while (i < source.length) {
    const ch = source[i]
    if (inString) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === inString) inString = null
      i++
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch
      i++
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

/** Extracts top-level `key:` identifiers from a defineMessages(...) object body. */
function extractTopLevelKeys(body: string): string[] {
  const blanked = blankStrings(body)
  const keys: string[] = []
  let depth = 0
  let i = 0
  while (i < blanked.length) {
    const ch = blanked[i]
    if (ch === '{') {
      depth++
      i++
      continue
    }
    if (ch === '}') {
      depth--
      i++
      continue
    }
    if (depth === 0) {
      const m = /^\s*([A-Za-z_$][\w$]*)\s*:/.exec(blanked.slice(i))
      if (m) {
        keys.push(m[1]!)
        i += m[0].length
        continue
      }
    }
    i++
  }
  return keys
}

/** Parses `builtin.ts` into a namespace → key-set map, e.g. dataTable → {search, previousPage, ...}. */
function parseBuiltinCatalog(source: string): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  const defRe = /(\w+):\s*defineMessages\(\s*(['"`])(?:(?!\2).)*\2\s*,\s*\{/g
  let m: RegExpExecArray | null
  while ((m = defRe.exec(source)) !== null) {
    const propName = m[1]!
    const openIndex = defRe.lastIndex - 1
    const closeIndex = findMatchingBrace(source, openIndex)
    if (closeIndex === -1) continue
    const body = source.slice(openIndex + 1, closeIndex)
    result.set(propName, new Set(extractTopLevelKeys(body)))
  }
  return result
}

interface Usage {
  file: string
  line: number
  namespace: string
  key: string
}

function collectSourceFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) results.push(...collectSourceFiles(full))
      else if (extname(entry) === '.ts' || extname(entry) === '.tsx') results.push(full)
    }
  } catch {
    // skip unreadable dirs
  }
  return results
}

function findBuiltinUsages(source: string, filename: string): Usage[] {
  const usages: Usage[] = []
  const usageRe = /\bbuiltin\.([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/g
  let m: RegExpExecArray | null
  while ((m = usageRe.exec(source)) !== null) {
    const line = source.slice(0, m.index).split('\n').length
    usages.push({ file: filename, line, namespace: m[1]!, key: m[2]! })
  }
  return usages
}

describe('i18n:check — every builtin.<ns>.<key> reference exists in the catalog', () => {
  const catalog = parseBuiltinCatalog(readFileSync(BUILTIN_PATH, 'utf8'))

  it('parses at least one namespace from builtin.ts (parser sanity check)', () => {
    assert.ok(catalog.size > 0, 'expected to parse namespaces from packages/i18n/src/builtin.ts')
    assert.ok(catalog.get('dataTable')?.has('previousPage'))
  })

  it('every referenced key is defined in the catalog', () => {
    const files = collectSourceFiles(SCAN_ROOT)
    const violations: Usage[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      const relFile = relative(REPO_ROOT, file)
      for (const usage of findBuiltinUsages(source, relFile)) {
        const keys = catalog.get(usage.namespace)
        if (!keys || !keys.has(usage.key)) violations.push(usage)
      }
    }

    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line}  builtin.${v.namespace}.${v.key} not in builtin.ts`)
        .join('\n')
      assert.fail(
        `${violations.length} reference(s) to undefined i18n builtin keys ` +
          `(a version-skewed @cascivo/i18n install would crash on these):\n${msg}\n\n` +
          `Fix: add the key to the matching namespace in packages/i18n/src/builtin.ts, ` +
          `or correct the typo in the component.`,
      )
    }
  })
})
