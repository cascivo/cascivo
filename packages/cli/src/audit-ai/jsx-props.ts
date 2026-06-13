import type { Contract } from '../utils/contract-pure.js'

export interface PropFinding {
  file: string
  line: number
  component: string
  prop: string
  level: 'error' | 'info'
  rule: 'unknown-prop' | 'spread-suppressed'
  message: string
}

/** Props always allowed on any cascade component (DOM passthrough / React intrinsics). */
const PASSTHROUGH = new Set(['className', 'style', 'id', 'ref', 'key', 'children'])

function isPassthrough(prop: string): boolean {
  if (PASSTHROUGH.has(prop)) return true
  if (prop.startsWith('data-')) return true
  if (prop.startsWith('aria-')) return true
  if (/^on[A-Z]/.test(prop)) return true
  return false
}

/** Names imported from @cascade-ui/react in this source. */
export function importedCascadeComponents(source: string): Set<string> {
  const names = new Set<string>()
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]@cascade-ui\/react['"]/g
  for (const m of source.matchAll(importRe)) {
    const group = m[1]
    if (group === undefined) continue
    for (const raw of group.split(',')) {
      const name = raw
        .trim()
        .split(/\s+as\s+/)[0]
        ?.trim()
      if (name) names.add(name)
    }
  }
  return names
}

/** Find each opening tag for `comp`, returning its attribute substring + start index. */
export interface OpeningTag {
  attrs: string
  index: number
  hasSpread: boolean
}

export function findOpeningTags(source: string, comp: string): OpeningTag[] {
  const tags: OpeningTag[] = []
  const re = new RegExp(`<${comp}(?=[\\s/>])`, 'g')
  for (const m of source.matchAll(re)) {
    const start = m.index ?? 0
    // Walk forward to the matching '>' that closes the opening tag, respecting
    // nested braces (JSX expressions) and quoted strings.
    let i = start + m[0].length
    let depth = 0
    let quote = ''
    let attrs = ''
    let closed = false
    for (; i < source.length; i++) {
      const ch = source[i]
      if (quote) {
        if (ch === quote) quote = ''
        attrs += ch
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch
        attrs += ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) {
        closed = true
        break
      }
      attrs += ch
    }
    if (!closed) continue
    const cleanAttrs = attrs.replace(/\/$/, '')
    tags.push({ attrs: cleanAttrs, index: start, hasSpread: /\{\s*\.\.\./.test(cleanAttrs) })
  }
  return tags
}

/** Extract top-level attribute names from an opening-tag attribute string. */
export function extractAttrNames(attrs: string): string[] {
  const names: string[] = []
  let depth = 0
  let quote = ''
  let token = ''
  const flush = () => {
    const name = token.trim().split('=')[0]?.trim()
    if (name && /^[A-Za-z]/.test(name)) names.push(name)
    token = ''
  }
  for (let i = 0; i < attrs.length; i++) {
    const ch = attrs[i]
    if (ch === undefined) continue
    if (quote) {
      if (ch === quote) quote = ''
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '{') {
      depth++
      continue
    }
    if (ch === '}') {
      depth--
      continue
    }
    if (depth > 0) continue
    if (ch === '=') {
      flush()
      // skip the value: handled by quote/brace state on next chars; reset token
      token = ''
      continue
    }
    if (/\s/.test(ch)) {
      if (token.trim()) flush()
      continue
    }
    token += ch
  }
  if (token.trim()) flush()
  return names
}

export function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') line++
  }
  return line
}

/**
 * Check JSX usages of imported cascade components for unknown props.
 * Heuristic — regex/brace-aware scan, not a full AST. Elements using a spread
 * (`{...rest}`) are reported as info and skipped (props can't be statically known).
 */
export function findJsxPropViolations(
  source: string,
  filename: string,
  contract: Contract,
): PropFinding[] {
  const findings: PropFinding[] = []
  const tracked = importedCascadeComponents(source)

  for (const comp of tracked) {
    const info = contract.components.get(comp)
    if (!info) continue
    const known = new Set(info.props.map((p) => p.name))

    for (const tag of findOpeningTags(source, comp)) {
      const line = lineOf(source, tag.index)
      if (tag.hasSpread) {
        findings.push({
          file: filename,
          line,
          component: comp,
          prop: '...',
          level: 'info',
          rule: 'spread-suppressed',
          message: `<${comp}> uses a spread — prop checks skipped`,
        })
        continue
      }
      for (const name of extractAttrNames(tag.attrs)) {
        if (isPassthrough(name)) continue
        if (known.has(name)) continue
        findings.push({
          file: filename,
          line,
          component: comp,
          prop: name,
          level: 'error',
          rule: 'unknown-prop',
          message: `<${comp}> has unknown prop "${name}"`,
        })
      }
    }
  }

  return findings
}
