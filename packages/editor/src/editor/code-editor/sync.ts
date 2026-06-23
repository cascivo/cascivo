/** A minimal text change: replace `[from, to)` in the old text with `insert`. */
export interface Change {
  from: number
  to: number
  insert: string
}

/**
 * Minimal diff between two strings via common-prefix + common-suffix scan. Returns
 * the single changed span in `prev` coordinates plus the inserted text. O(n) and
 * good enough for the controlled-sync case (one external edit at a time).
 */
export function diff(prev: string, next: string): Change {
  if (prev === next) return { from: prev.length, to: prev.length, insert: '' }
  const min = Math.min(prev.length, next.length)
  let start = 0
  while (start < min && prev[start] === next[start]) start++
  let endPrev = prev.length
  let endNext = next.length
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--
    endNext--
  }
  return { from: start, to: endPrev, insert: next.slice(start, endNext) }
}

/** Rebase a single offset across a {@link Change} so it points at the same logical spot. */
export function rebaseOffset(offset: number, change: Change): number {
  if (offset <= change.from) return offset
  if (offset >= change.to) return offset + (change.insert.length - (change.to - change.from))
  // Inside the replaced span — clamp to the end of the inserted text.
  return change.from + change.insert.length
}

/** Rebase a selection range across a {@link Change}. */
export function rebaseSelection(
  start: number,
  end: number,
  change: Change,
): { start: number; end: number } {
  return { start: rebaseOffset(start, change), end: rebaseOffset(end, change) }
}
