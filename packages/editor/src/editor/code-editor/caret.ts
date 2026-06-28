import { offsetToLineCol } from './find.ts'

/**
 * Inputs for the arithmetic caret position: the monospace glyph advance, the line
 * box height, the live scroll offsets, the editing surface's content padding, and
 * the tab width. All in CSS pixels; `tabSize` in columns.
 */
export interface CaretMetrics {
  charWidth: number
  lineHeight: number
  scrollTop: number
  scrollLeft: number
  padTop: number
  padLeft: number
  tabSize: number
}

/**
 * Expand a raw column (character count from the line start) to a VISUAL column,
 * honoring tab stops: a `\t` advances to the next multiple of `tabSize`, every
 * other char advances by one. `lineText` is the slice of the current line up to
 * the caret.
 */
function visualColumn(lineText: string, tabSize: number): number {
  let col = 0
  for (const ch of lineText) {
    if (ch === '\t') col += tabSize - (col % tabSize)
    else col += 1
  }
  return col
}

/**
 * Map a document offset to a `{ top, left }` pixel position within the editing
 * surface's content box — the DEFAULT (arithmetic) path. Exact for a monospace
 * font with `insertSpaces`/no-wrap (the editor default); under soft-wrap or with
 * proportional glyphs prefer {@link caretRectFromPre}. Pure and DOM-free.
 */
export function caretCoords(
  text: string,
  offset: number,
  m: CaretMetrics,
): { top: number; left: number } {
  const { line, col } = offsetToLineCol(text, offset)
  const lineText = text.slice(offset - col, offset)
  const vcol = visualColumn(lineText, m.tabSize)
  return {
    top: line * m.lineHeight - m.scrollTop + m.padTop,
    left: vcol * m.charWidth - m.scrollLeft + m.padLeft,
  }
}

/**
 * Map a document offset to a viewport-relative rect by placing a collapsed DOM
 * `Range` at the matching position in the already-rendered, pixel-aligned `.pre`
 * highlight layer — the FIDELITY path, correct under tabs and soft-wrap. Returns
 * `null` when the offset is not currently rendered (e.g. windowed out — never the
 * case while typing). The caller subtracts the `.codeArea` origin to localize.
 */
export function caretRectFromPre(pre: HTMLElement, offset: number): DOMRect | null {
  if (typeof document === 'undefined') return null
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
  let acc = 0
  let node = walker.nextNode()
  while (node) {
    const len = node.textContent?.length ?? 0
    if (offset <= acc + len) {
      const range = document.createRange()
      range.setStart(node, Math.max(0, offset - acc))
      range.collapse(true)
      const rects = range.getClientRects()
      return rects.length > 0 ? rects[0]! : range.getBoundingClientRect()
    }
    acc += len
    node = walker.nextNode()
  }
  return null
}

/**
 * Measure the monospace glyph advance of a textarea once (the caller caches the
 * result and only re-measures on a font change). Uses a detached probe spanning a
 * known run so sub-pixel advances average out. SSR-safe (returns 0 with no DOM —
 * the caller skips positioning until a real measurement is available).
 */
export function measureCharWidth(ta: HTMLTextAreaElement): number {
  if (typeof document === 'undefined') return 0
  const cs = getComputedStyle(ta)
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.whiteSpace = 'pre'
  probe.style.font = cs.font
  probe.style.letterSpacing = cs.letterSpacing
  probe.style.tabSize = cs.tabSize
  probe.textContent = '0'.repeat(10)
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width / 10
  probe.remove()
  return width
}
