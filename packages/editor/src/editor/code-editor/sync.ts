/** A minimal text change: replace `[from, to)` in the old text with `insert`. */
export interface Change {
  from: number
  to: number
  insert: string
}

/**
 * Chars compared per step of the coarse scan in {@link diff}. A `slice` this long is
 * a view, not a copy, and comparing two views is one native `memcmp` — so the
 * document is walked in 1k blocks instead of one JS char compare at a time. The
 * block is refined per char only where it differs.
 */
const BLOCK = 1024

/**
 * Minimal diff between two strings via common-prefix + common-suffix scan. Returns
 * the single changed span in `prev` coordinates plus the inserted text.
 *
 * Still O(n), but n is walked by native block compares rather than a per-character
 * JS loop. This runs on **every keystroke** — once in the render to find the line
 * to invalidate, once in the history to record the step — and the per-char loop
 * was ~12 ms on a 2.7 MB document, the single largest JS cost per key. Block
 * compares bring it to ~0.4 ms.
 */
export function diff(prev: string, next: string): Change {
  if (prev === next) return { from: prev.length, to: prev.length, insert: '' }
  const min = Math.min(prev.length, next.length)
  let start = 0
  while (
    start + BLOCK <= min &&
    prev.slice(start, start + BLOCK) === next.slice(start, start + BLOCK)
  ) {
    start += BLOCK
  }
  while (start < min && prev[start] === next[start]) start++
  let endPrev = prev.length
  let endNext = next.length
  while (
    endPrev - BLOCK >= start &&
    endNext - BLOCK >= start &&
    prev.slice(endPrev - BLOCK, endPrev) === next.slice(endNext - BLOCK, endNext)
  ) {
    endPrev -= BLOCK
    endNext -= BLOCK
  }
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
