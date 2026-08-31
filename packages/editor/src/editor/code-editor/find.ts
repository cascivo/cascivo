import type { LineIndex } from '../../engine/line-index.ts'
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

/**
 * Map an offset back to its `{ line, col }` for a one-off lookup with no
 * {@link LineIndex} to hand (the caret-proxy position). Scans with `indexOf`
 * rather than per character — same O(offset), but the engine's vectorized search
 * instead of a JS loop, which is ~13x on a multi-megabyte document. Repeated
 * lookups over one text belong on a {@link LineIndex} instead, where they are
 * O(log n).
 */
export function offsetToLineCol(text: string, offset: number): { line: number; col: number } {
  let line = 0
  let lineStart = 0
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1)) {
    line++
    lineStart = i + 1
  }
  return { line, col: offset - lineStart }
}

/**
 * Convert matches to per-line column {@link Decoration}s. The current match gets
 * `classes.current`, the rest `classes.match`. Literal queries are single-line, so
 * each match maps to one decoration on its line.
 *
 * Takes a {@link LineIndex}, not the raw text: one lookup per match against a
 * scanning `offsetToLineCol` is O(matches x offset), so a common word in a large
 * file froze the frame outright (~5,000 hits x ~9 ms). Against the index each
 * lookup is a binary search.
 */
export function toDecorations(
  index: LineIndex,
  matches: readonly Match[],
  currentIndex: number,
  classes: { match: string; current: string },
): Decoration[] {
  return matches.map((m, idx) => {
    const { line, col } = index.locate(m.start)
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

/**
 * A one-slot memo of {@link scan} keyed by `(text, query, caseSensitive)`.
 *
 * The editor's render reads `scrollTop`, so it re-runs on every scroll frame — and
 * with the find panel open that re-ran a whole-document scan each time, including
 * the `toLowerCase()` copy of the entire text for the case-insensitive default. None
 * of that depends on having scrolled.
 */
export function createScanCache(): (
  text: string,
  query: string,
  caseSensitive: boolean,
) => readonly Match[] {
  let key: string | undefined
  let text: string | undefined
  // Read-only because callers share this exact array across renders — mutating it
  // would corrupt every later memo hit.
  let hit: readonly Match[] = []
  return (nextText, query, caseSensitive) => {
    const nextKey = `${caseSensitive ? 'S' : 'i'}${query}`
    if (nextText === text && nextKey === key) return hit
    text = nextText
    key = nextKey
    hit = scan(nextText, query, { caseSensitive })
    return hit
  }
}
