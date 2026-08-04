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
export const PASSTHROUGH = new Set(['className', 'style', 'id', 'ref', 'key', 'children'])

/**
 * Standard HTML/React DOM attributes. Every cascade component extends an
 * `HTMLAttributes` interface and spreads `{...props}` onto its element (verified
 * in button.tsx, card.tsx, …), so these are valid at runtime even though the
 * hand-written `*.meta.ts` prop lists (the audit contract) don't enumerate them.
 * Without this set, a legitimate `type`/`name`/`title`/`tabIndex` on a Button is
 * a non-suppressible `unknown-prop` error — the audit-loop deadlock.
 */
export const HTML_PASSTHROUGH = new Set([
  'type',
  'name',
  'value',
  'defaultValue',
  'checked',
  'defaultChecked',
  'placeholder',
  'title',
  'role',
  'tabIndex',
  'form',
  'href',
  'target',
  'rel',
  'download',
  'src',
  'alt',
  'width',
  'height',
  'loading',
  'autoComplete',
  'autoFocus',
  'required',
  'readOnly',
  'min',
  'max',
  'step',
  'rows',
  'cols',
  'wrap',
  'maxLength',
  'minLength',
  'pattern',
  'multiple',
  'accept',
  'size',
  'dir',
  'lang',
  'hidden',
  'draggable',
  'spellCheck',
  'contentEditable',
  'inputMode',
  'enterKeyHint',
  'htmlFor',
  'slot',
  'disabled',
  'open',
])

function isPassthrough(prop: string, contract?: Contract): boolean {
  if (PASSTHROUGH.has(prop)) return true
  // Resolved from the component types at contract-generation time. `HTML_PASSTHROUGH` below
  // is the pre-contract fallback for an older shipped contract that lacks the field.
  if (contract?.domAttributes.has(prop) === true) return true
  if (HTML_PASSTHROUGH.has(prop)) return true
  if (prop.startsWith('data-')) return true
  if (prop.startsWith('aria-')) return true
  if (/^on[A-Z]/.test(prop)) return true
  return false
}

/**
 * Local JSX names bound to a cascade component, mapped to the contract name they refer to.
 *
 * Two rules, both learned from false positives on correct code:
 *
 * 1. **Track the LOCAL binding, not the imported name.** `import { Link as CascadeLink }`
 *    used to register `Link`, so the scan then matched the *router's* `<Link to=…>` and
 *    reported `to` as an unknown prop. For a router-based app that collateral is close to
 *    guaranteed.
 * 2. **Never audit a name this file also imports from somewhere else.** A bare-name clash
 *    (`Link` from `@tanstack/react-router`) must not be audited against cascivo's contract
 *    even when nothing is aliased.
 */
export function importedCascadeComponents(source: string): Map<string, string> {
  const names = new Map<string, string>()
  const foreign = new Set<string>()

  const importRe = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g
  for (const m of source.matchAll(importRe)) {
    const [, group, specifier] = m
    if (group === undefined || specifier === undefined) continue
    const isCascade = specifier === '@cascivo/react'
    for (const raw of group.split(',')) {
      const parts = raw.trim().split(/\s+as\s+/)
      const imported = parts[0]?.trim().replace(/^type\s+/, '')
      const local = (parts[1] ?? parts[0])?.trim()
      if (!imported || !local) continue
      if (isCascade) names.set(local, imported)
      else foreign.add(local)
    }
  }
  // A default import (`import Link from 'next/link'`) also shadows the name.
  for (const m of source.matchAll(
    /import\s+(\w+)\s*(?:,\s*\{[^}]*\})?\s*from\s*['"]([^'"]+)['"]/g,
  )) {
    if (m[2] !== '@cascivo/react' && m[1]) foreign.add(m[1])
  }

  for (const local of foreign) names.delete(local)
  return names
}

/** Find each opening tag for `comp`, returning its attribute substring + start index. */
export interface OpeningTag {
  attrs: string
  index: number
  hasSpread: boolean
  /** `<Foo />` — the one shape that genuinely cannot have children. */
  selfClosing: boolean
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
    const selfClosing = /\/\s*$/.test(attrs)
    const cleanAttrs = attrs.replace(/\/\s*$/, '')
    tags.push({
      attrs: cleanAttrs,
      index: start,
      hasSpread: /\{\s*\.\.\./.test(cleanAttrs),
      selfClosing,
    })
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

  for (const [comp, contractName] of tracked) {
    const info = contract.components.get(contractName)
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
        if (isPassthrough(name, contract)) continue
        if (known.has(name)) continue
        findings.push({
          file: filename,
          line,
          component: comp,
          prop: name,
          level: 'error',
          rule: 'unknown-prop',
          message:
            `<${comp}> has unknown prop "${name}". ` +
            'style/className pass through on every component (see the override ladder in ' +
            'docs/AI-RULES.md); for an intentional one-off add `/* cascivo-audit: allow unknown-prop */`.',
        })
      }
    }
  }

  return findings
}
