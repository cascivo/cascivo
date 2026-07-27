import type { Contract } from '../utils/contract-pure.js'
import { normalizeValue } from '../utils/contract-pure.js'

export interface LiteralFinding {
  file: string
  line: number
  property: string
  value: string
  level: 'error' | 'warn' | 'info'
  rule: 'hardcoded-value'
  /** only when exactly one catalog match */
  suggestedToken?: string
  /** when multiple catalog matches → info */
  allMatches?: string[]
}

/** Visual CSS properties whose literal values should be tokens. */
const VISUAL_PROPS = new Set([
  'color',
  'background',
  'background-color',
  'border-color',
  'box-shadow',
  'border-radius',
  'font-size',
  'gap',
  'padding',
  'margin',
  'width',
  'height',
])

/** Inline-style camelCase → kebab-case for the props we care about. */
const INLINE_PROP_MAP: Record<string, string> = {
  color: 'color',
  background: 'background',
  backgroundColor: 'background-color',
  borderColor: 'border-color',
  boxShadow: 'box-shadow',
  borderRadius: 'border-radius',
  fontSize: 'font-size',
  gap: 'gap',
  padding: 'padding',
  margin: 'margin',
  width: 'width',
  height: 'height',
}

/** A literal value worth checking: hex, oklch/rgb/hsl(a), or px/rem number. */
function isLiteralValue(value: string): boolean {
  const v = value.trim()
  if (v.includes('var(')) return false
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return true
  if (/^(oklch|oklab|rgb|rgba|hsl|hsla)\(/i.test(v)) return true
  if (/^-?\d*\.?\d+(px|rem)$/.test(v)) return true
  return false
}

function classify(
  value: string,
  contract: Contract,
): Pick<LiteralFinding, 'level' | 'suggestedToken' | 'allMatches'> | null {
  const matches = contract.tokensByValue.get(normalizeValue(value))
  if (!matches || matches.length === 0) return null
  const first = matches[0]
  if (matches.length === 1 && first) return { level: 'error', suggestedToken: first }
  return { level: 'info', allMatches: matches }
}

/**
 * Character ranges covered by a JSX `style={{ … }}` object.
 *
 * The inline-style scan used to run over every `prop: 'value'` pair in a `.tsx` file, so a
 * plain data object was audited as if it were CSS: a `DataTable` column's
 * `width: '3rem'` was reported as a hardcoded value that should be `--cascivo-space-12`.
 * A spacing token is not the right unit for a table column, and the object was never a
 * style in the first place — the rule was matching the literal, not the context.
 */
function styleObjectRanges(source: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const re = /style\s*=\s*\{/g
  for (const m of source.matchAll(re)) {
    let depth = 0
    let quote = ''
    for (let i = m.index! + m[0].length - 1; i < source.length; i++) {
      const ch = source[i]
      if (quote) {
        if (ch === quote) quote = ''
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          ranges.push([m.index!, i])
          break
        }
      }
    }
  }
  return ranges
}

/**
 * Detect literal color/size values in CSS declarations and TSX inline styles
 * that exactly match a known cascade token. Heuristic, line-based — no full
 * CSS/JS parse. Values with no catalog match are NOT flagged (arbitrary brand
 * values are allowed).
 */
export function findCssLiteralViolations(
  source: string,
  filename: string,
  contract: Contract,
): LiteralFinding[] {
  const findings: LiteralFinding[] = []
  const lines = source.split('\n')
  const styleRanges = styleObjectRanges(source)
  // Absolute offset of the start of each line, so a match can be tested against the ranges.
  const lineStarts: number[] = []
  let offset = 0
  for (const line of lines) {
    lineStarts.push(offset)
    offset += line.length + 1
  }
  const inStyleObject = (absolute: number): boolean =>
    styleRanges.some(([start, end]) => absolute >= start && absolute <= end)

  // CSS declaration: `property: value;` (also matches the kebab props inside style="...")
  const cssDecl = /(^|[;{\s])([a-z-]+)\s*:\s*([^;}{]+?)\s*(?=[;}]|$)/gi
  // Inline JSX style object: `color: '#fff'` or `color: "#fff"`
  const inlineDecl = /([A-Za-z][A-Za-z]*)\s*:\s*(['"])([^'"]+)\2/g

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const seen = new Set<string>()

    for (const m of line.matchAll(cssDecl)) {
      if (m[2] === undefined || m[3] === undefined) continue
      const prop = m[2].toLowerCase()
      const rawValue = m[3].trim()
      if (!VISUAL_PROPS.has(prop)) continue
      if (!isLiteralValue(rawValue)) continue
      const cls = classify(rawValue, contract)
      if (!cls) continue
      const key = `${prop}|${rawValue}`
      seen.add(key)
      findings.push({
        file: filename,
        line: i + 1,
        property: prop,
        value: rawValue,
        rule: 'hardcoded-value',
        ...cls,
      })
    }

    for (const m of line.matchAll(inlineDecl)) {
      if (m[1] === undefined || m[3] === undefined) continue
      const prop = INLINE_PROP_MAP[m[1]]
      if (!prop) continue
      // Only inside an actual `style={{ … }}`; a data object that happens to have a
      // `width` key is not CSS.
      if (!inStyleObject((lineStarts[i] ?? 0) + (m.index ?? 0))) continue
      const rawValue = m[3].trim()
      if (!isLiteralValue(rawValue)) continue
      const key = `${prop}|${rawValue}`
      if (seen.has(key)) continue
      const cls = classify(rawValue, contract)
      if (!cls) continue
      // Inline TSX `style={{…}}` overrides are a sanctioned fast-prototyping escape
      // hatch — surface a gentle `warn` (not a loop-blocking `error`) so an agent can
      // finish. `.css`-file literals stay `error`: there the fix is mechanical (`--fix`).
      const inlineCls = cls.level === 'error' ? { ...cls, level: 'warn' as const } : cls
      findings.push({
        file: filename,
        line: i + 1,
        property: prop,
        value: rawValue,
        rule: 'hardcoded-value',
        ...inlineCls,
      })
    }
  }

  return findings
}
