import { offsetToLineCol } from './find.ts'
import type { Decoration } from '../view.tsx'

const OPENERS: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '}' }

function scanForward(text: string, from: number, open: string, close: string): number {
  let depth = 0
  for (let i = from; i < text.length; i++) {
    const c = text[i]
    if (c === open) depth++
    else if (c === close && --depth === 0) return i
  }
  return -1
}

function scanBackward(text: string, from: number, open: string, close: string): number {
  let depth = 0
  for (let i = from; i >= 0; i--) {
    const c = text[i]
    if (c === close) depth++
    else if (c === open && --depth === 0) return i
  }
  return -1
}

/**
 * Find the bracket matching the one adjacent to the caret, if any. Checks the
 * character on either side of the caret. Literal scan with a depth counter — no
 * string/comment awareness (a deliberate v1 simplification). Returns the offsets
 * of the open and close bracket, or `undefined` when there is no balanced partner.
 */
export function matchBracket(
  text: string,
  caret: number,
): { open: number; close: number } | undefined {
  const after = text[caret]
  if (after && after in OPENERS) {
    const close = scanForward(text, caret, after, OPENERS[after] as string)
    if (close !== -1) return { open: caret, close }
  }
  const before = text[caret - 1]
  if (before && before in CLOSERS) {
    const open = scanBackward(text, caret - 1, CLOSERS[before] as string, before)
    if (open !== -1) return { open, close: caret - 1 }
  }
  if (before && before in OPENERS) {
    const close = scanForward(text, caret - 1, before, OPENERS[before] as string)
    if (close !== -1) return { open: caret - 1, close }
  }
  if (after && after in CLOSERS) {
    const open = scanBackward(text, caret, CLOSERS[after] as string, after)
    if (open !== -1) return { open, close: caret }
  }
  return undefined
}

/** Convert a matched bracket pair to two single-column {@link Decoration}s. */
export function toBracketDecorations(
  text: string,
  match: { open: number; close: number },
  className: string,
): Decoration[] {
  return [match.open, match.close].map((offset) => {
    const { line, col } = offsetToLineCol(text, offset)
    return { line, start: col, end: col + 1, className }
  })
}
