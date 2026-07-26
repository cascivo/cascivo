/**
 * Extract the default values a component actually applies, from its parameter
 * destructuring — the ground truth `PropMeta.default` must match.
 *
 * Why this exists: `PropMeta.default` has always been available and 387 props used it, but
 * nothing required it, so 126 props across 73 components applied a default the manifest
 * never mentioned. The generated props tables render a `Default` column, so those rows read
 * `—` — an adopter has no way to learn the value short of opening the shipped JS, which is
 * exactly what the 2026-07-25 report did after `<Flex justify="between">` silently produced
 * a centered vertical stack (`direction` defaults to `'vertical'`, unlike CSS `flex-direction`).
 */

import { readFileSync } from 'node:fs'

/** Find the parameter-destructuring block of `export function <name>(…)`. */
function destructuringBlock(src: string, name: string): string | null {
  const decl = new RegExp(`export function ${name}\\s*(?:<[^(]*>)?\\s*\\(`).exec(src)
  if (!decl) return null
  const open = src.indexOf('{', decl.index)
  if (open === -1) return null

  // The destructuring `{` must come before the body `{`; if the parameter list closes first,
  // this component takes a plain (non-destructured) parameter and has no signature defaults.
  const paramsEnd = src.indexOf(')', decl.index)
  if (paramsEnd !== -1 && open > paramsEnd) return null

  let depth = 0
  for (let i = open; i < src.length; i++) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return src.slice(open + 1, i)
    }
  }
  return null
}

/** Split on commas that are at nesting depth 0 and outside strings/templates. */
function splitTopLevel(block: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  let quote: string | null = null
  for (let i = 0; i < block.length; i++) {
    const ch = block[i]!
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch
    else if ('{[('.includes(ch)) depth++
    else if ('}])'.includes(ch)) depth--
    else if (ch === ',' && depth === 0) {
      parts.push(block.slice(start, i))
      start = i + 1
    }
  }
  parts.push(block.slice(start))
  return parts
}

/** Strip comments so a `// note` line can't be read as part of a default expression. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/** Normalize a default expression: collapse whitespace, prefer single quotes. */
export function normalizeDefault(value: string): string {
  return value.trim().replace(/\s+/g, ' ').replace(/"/g, "'")
}

/**
 * Comparison form. Manifests store string defaults unquoted (`md`, not `'md'`) because the
 * generated props tables read better that way, so quotes are not significant here.
 */
export function comparableDefault(value: string): string {
  const v = normalizeDefault(value)
  const unquoted = /^'(.*)'$/.exec(v)
  return unquoted ? unquoted[1]! : v
}

/**
 * Is this default a literal we can compare against the manifest? An identifier or call
 * (`DEFAULT_SNAP_POINTS`, `() => {}`) is a reference whose *value* the manifest documents —
 * for those we require a documented default but not an equal one.
 */
export function isLiteralDefault(value: string): boolean {
  const v = normalizeDefault(value)
  return /^('.*'|-?\d[\d._]*|true|false|null|\[.*\]|\{.*\})$/.test(v)
}

/**
 * `prop -> default expression` for every prop the component destructures with a default.
 * Rest elements, renames and defaultless props are skipped.
 */
export function signatureDefaults(file: string, componentName: string): Map<string, string> {
  const out = new Map<string, string>()
  const block = destructuringBlock(stripComments(readFileSync(file, 'utf8')), componentName)
  if (!block) return out
  for (const part of splitTopLevel(block)) {
    const trimmed = part.trim()
    if (!trimmed || trimmed.startsWith('...')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const name = trimmed.slice(0, eq).trim()
    // Only plain identifiers: a nested pattern or a rename isn't a documentable prop default.
    if (!/^\w+$/.test(name)) continue
    const value = trimmed.slice(eq + 1).trim()
    if (value) out.set(name, normalizeDefault(value))
  }
  return out
}
