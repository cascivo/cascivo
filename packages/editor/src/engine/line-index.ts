/**
 * A document's line structure as an **offset table** rather than an array of
 * strings: one `Int32Array` of line-start offsets, built with a vectorized
 * `indexOf` sweep.
 *
 * The editor asks two questions constantly — "which line is this offset on?"
 * (the current-line marker, find decorations, the invalidation point of an edit)
 * and "how many lines are there?" (windowing, the gutter). Answering either with
 * `text.slice(0, offset).split('\n').length` is O(n) *and* allocates one string
 * per line; at 50k lines that is ~2 ms and 50k allocations for a single caret
 * move, which is why the marker fell behind the caret on a large document.
 *
 * Here `count` is a field and `lineAt` is a binary search (~0.0001 ms), so those
 * queries stop scaling with the document. The full `string[]` the tokenizer needs
 * is still available via {@link LineIndex.toArray}, but built **once per text**
 * and memoized — not once per render, which previously meant once per scroll
 * frame.
 */

/**
 * Test-only work counters. Not part of the public API.
 *
 * The perf guards assert on pairs, never on one number alone: a document-scanning
 * regression would route around this module entirely and read zero everywhere, so
 * "no rebuilds" is only meaningful next to "and the seam was actually used".
 */
export interface LineIndexStats {
  /** Offset tables built (one O(n) sweep each). */
  builds: number
  /** `lineAt` / `locate` queries answered (each a binary search). */
  lookups: number
  /** `toArray()` calls — how often a caller wanted the lines. */
  arrayReads: number
  /** `toArray()` calls that actually split the text (the rest were memo hits). */
  arraySplits: number
}

const stats: LineIndexStats = { builds: 0, lookups: 0, arrayReads: 0, arraySplits: 0 }

/** Test-only: work done since the last reset. Not part of the public API. */
export function __lineIndexStats(): LineIndexStats {
  return { ...stats }
}

/** Test-only: reset the work counters. Not part of the public API. */
export function __resetLineIndexStats(): void {
  stats.builds = 0
  stats.lookups = 0
  stats.arrayReads = 0
  stats.arraySplits = 0
}

/** Line structure of one immutable document text. */
export interface LineIndex {
  /** The text this index describes — identity is what the cache keys on. */
  readonly text: string
  /** Line count. Always ≥ 1: the empty document is one empty line. */
  readonly count: number
  /** Offset of the first character of `line` (clamped to the last line). O(1). */
  startOf(line: number): number
  /** Zero-based line containing `offset`. O(log n). */
  lineAt(offset: number): number
  /** Zero-based `{ line, col }` for `offset`. O(log n). */
  locate(offset: number): { line: number; col: number }
  /** The document split into lines — materialized on first call, then memoized. */
  toArray(): readonly string[]
}

/** Build a {@link LineIndex} for `text` in one pass. */
export function createLineIndex(text: string): LineIndex {
  stats.builds++
  let capacity = 64
  let starts = new Int32Array(capacity)
  let count = 1 // line 0 always starts at offset 0
  for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) {
    if (count === capacity) {
      capacity *= 2
      const grown = new Int32Array(capacity)
      grown.set(starts)
      starts = grown
    }
    starts[count++] = i + 1
  }

  const lineAt = (offset: number): number => {
    stats.lookups++
    let lo = 0
    let hi = count - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if ((starts[mid] as number) <= offset) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  let lines: readonly string[] | undefined
  return {
    text,
    count,
    startOf: (line) => starts[Math.max(0, Math.min(line, count - 1))] as number,
    lineAt,
    locate: (offset) => {
      const line = lineAt(offset)
      return { line, col: offset - (starts[line] as number) }
    },
    toArray: () => {
      stats.arrayReads++
      if (lines === undefined) {
        stats.arraySplits++
        lines = text.split('\n')
      }
      return lines
    },
  }
}

/**
 * A two-slot memo of {@link LineIndex} keyed by string identity.
 *
 * Two, not one: the editor holds two texts one frame apart — the live textarea
 * value (read by the caret sync on every `selectionchange`) and the rAF-debounced
 * highlight text (read by the render). A single slot would rebuild on every
 * alternation, which is exactly the per-keystroke cost this exists to remove.
 */
export function createLineIndexCache(): (text: string) => LineIndex {
  let recent: LineIndex | undefined
  let older: LineIndex | undefined
  return (text) => {
    if (recent?.text === text) return recent
    if (older?.text === text) {
      const hit = older
      older = recent
      recent = hit
      return hit
    }
    older = recent
    recent = createLineIndex(text)
    return recent
  }
}
