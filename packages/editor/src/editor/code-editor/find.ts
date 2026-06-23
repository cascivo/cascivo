import type { Decoration } from '../view.tsx'

/** A search hit as absolute document offsets `[start, end)`. */
export interface Match {
  start: number
  end: number
}

/** Options controlling how {@link scan} matches. */
export interface ScanOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
}

const WORD = /\w/

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD.test(ch)
}

/**
 * Find every (non-overlapping) literal occurrence of `query` in `text`. Literal,
 * not regex — safe and predictable for a find box. Empty query → no matches.
 */
export function scan(text: string, query: string, opts: ScanOptions = {}): Match[] {
  if (query.length === 0) return []
  const hay = opts.caseSensitive ? text : text.toLowerCase()
  const needle = opts.caseSensitive ? query : query.toLowerCase()
  const matches: Match[] = []
  let from = 0
  for (;;) {
    const i = hay.indexOf(needle, from)
    if (i === -1) break
    const end = i + needle.length
    if (!opts.wholeWord || (!isWordChar(text[i - 1]) && !isWordChar(text[end]))) {
      matches.push({ start: i, end })
    }
    from = end > i ? end : i + 1
  }
  return matches
}

/** Map a match index back to its `{ line, col }` (used for decorations + scroll). */
export function offsetToLineCol(text: string, offset: number): { line: number; col: number } {
  let line = 0
  let lineStart = 0
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, col: offset - lineStart }
}

/**
 * Convert matches to per-line column {@link Decoration}s. The current match gets
 * `classes.current`, the rest `classes.match`. Literal queries are single-line, so
 * each match maps to one decoration on its line.
 */
export function toDecorations(
  text: string,
  matches: readonly Match[],
  currentIndex: number,
  classes: { match: string; current: string },
): Decoration[] {
  return matches.map((m, idx) => {
    const { line, col } = offsetToLineCol(text, m.start)
    return {
      line,
      start: col,
      end: col + (m.end - m.start),
      className: idx === currentIndex ? classes.current : classes.match,
    }
  })
}

/** Replace a single match, returning the new text. */
export function replaceOne(text: string, match: Match, replacement: string): string {
  return text.slice(0, match.start) + replacement + text.slice(match.end)
}

/** Replace all matches (right-to-left so earlier offsets stay valid), returning the new text. */
export function replaceAll(text: string, matches: readonly Match[], replacement: string): string {
  let out = text
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i] as Match
    out = out.slice(0, m.start) + replacement + out.slice(m.end)
  }
  return out
}
