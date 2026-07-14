/**
 * Zero-dependency scanner for **unlayered style rules** in a CSS source.
 *
 * cascivo ships everything inside `@layer` blocks. Unlayered author CSS beats
 * every layered rule regardless of specificity (CSS cascade-layer semantics), so
 * a single unlayered style rule silently overrides the whole design system. This
 * scanner finds top-level style rules that live outside any `@layer` block.
 *
 * It is line-based and brace-tracking, not a full CSS parse — good enough because
 * we only need to know, for each `{`, whether an `@layer` block is an ancestor.
 *
 * Transparent to layering: `@media`, `@container`, `@supports`, `@scope` — a rule
 * inside these is layered iff the group is inside a layer. Ignored entirely:
 * `@keyframes`/`@font-face`/`@property`/`@page`/etc. (their inner blocks are not
 * style rules we govern). `@import`/`@charset`/`@layer;` statements are not blocks.
 */

export interface UnlayeredRule {
  /** 1-indexed line of the rule's selector. */
  line: number
  /** The selector text (trimmed, truncated) for the report. */
  selector: string
}

/** Replace comment bodies and string contents with spaces, preserving newlines. */
function blankCommentsAndStrings(source: string): string {
  let out = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const c = source[i]!
    const next = source[i + 1]
    if (c === '/' && next === '*') {
      out += '  '
      i += 2
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        out += source[i] === '\n' ? '\n' : ' '
        i++
      }
      out += '  '
      i += 2
    } else if (c === '"' || c === "'") {
      const quote = c
      out += ' '
      i++
      while (i < n && source[i] !== quote) {
        if (source[i] === '\\') {
          out += '  '
          i += 2
          continue
        }
        out += source[i] === '\n' ? '\n' : ' '
        i++
      }
      out += ' '
      i++
    } else {
      out += c
      i++
    }
  }
  return out
}

type FrameKind = 'layer' | 'group' | 'style' | 'other'

/**
 * Accessibility / user-preference media features whose overrides MUST win over
 * everything — including a consumer's `cascivo.override` layer — so they are
 * legitimately placed unlayered (top-level). A `@media (forced-colors: active)`
 * block outside `@layer` is the sanctioned cascade idiom, not a hotfix leak.
 */
const A11Y_GUARANTEE_RE =
  /@media[^{]*\b(forced-colors|prefers-contrast|prefers-reduced-motion|prefers-reduced-transparency|inverted-colors)\b/

function classifyPrelude(prelude: string): FrameKind {
  const p = prelude.trim().toLowerCase()
  if (p.startsWith('@layer')) return 'layer'
  // A11y-guarantee media queries are an exempt (non-flagging) context.
  if (A11Y_GUARANTEE_RE.test(p)) return 'other'
  if (
    p.startsWith('@media') ||
    p.startsWith('@container') ||
    p.startsWith('@supports') ||
    p.startsWith('@scope')
  ) {
    return 'group'
  }
  if (p.startsWith('@')) return 'other'
  return 'style'
}

/**
 * Return every top-level style rule that is NOT inside an `@layer` block. Only the
 * outermost unlayered rule is reported (nested rules inside it are implied).
 */
export function findUnlayeredRules(source: string): UnlayeredRule[] {
  const clean = blankCommentsAndStrings(source)
  const rules: UnlayeredRule[] = []
  const stack: FrameKind[] = []

  let preludeStart = 0
  const lineStarts: number[] = [0]
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '\n') lineStarts.push(i + 1)
  }
  const lineOf = (idx: number): number => {
    // binary search over lineStarts
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid]! <= idx) lo = mid
      else hi = mid - 1
    }
    return lo + 1
  }

  const hasAncestor = (kind: FrameKind): boolean => stack.includes(kind)

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (c === '{') {
      const prelude = clean.slice(preludeStart, i)
      const kind = classifyPrelude(prelude)
      if (
        kind === 'style' &&
        !hasAncestor('layer') &&
        !hasAncestor('other') &&
        !hasAncestor('style')
      ) {
        const trimmed = prelude.trim().replace(/\s+/g, ' ')
        const startIdx = preludeStart + (prelude.length - prelude.trimStart().length)
        rules.push({
          line: lineOf(startIdx),
          selector: trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed,
        })
      }
      stack.push(kind)
      preludeStart = i + 1
    } else if (c === '}') {
      stack.pop()
      preludeStart = i + 1
    } else if (c === ';') {
      // A statement terminator (@import, `@layer a, b;`, or a declaration inside a
      // block). Reset the prelude window so the next `{` sees a clean selector.
      preludeStart = i + 1
    }
  }

  return rules
}
