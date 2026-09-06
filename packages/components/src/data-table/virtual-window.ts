/**
 * The arithmetic behind the virtualized row window, kept pure so the two things that
 * decide whether a million-row table works — *which* rows to render, and *where* to put
 * them — are unit-testable without a DOM.
 *
 * Positions are arithmetic on a fixed row height (the density presets size every row to
 * `--_row-height`), so scrolling never measures. The one twist is the **canvas cap**:
 * browsers clamp an element's height — Chromium at 33,554,432 px, Firefox at 17,895,697 px
 * — and a million 49 px rows is 49,000,000 px. Sized honestly, the scroller silently stops
 * at the cap and the last ~160k rows can never be scrolled to (measured: 1,000,000 rows,
 * bottom of the scrollbar, last rendered row 838,871). So the canvas is capped and, above
 * the cap, the scroll position is mapped onto the row space by ratio, exactly the way the
 * big grids do it. Below the cap the ratio is 1 and the layout is byte-identical to the
 * naive spacer layout.
 */

/**
 * Tallest canvas the scroller is allowed to be. Under every engine's clamp with room to
 * spare, and still ~1.3 s of continuous wheel-scrolling from top to bottom at a typical
 * 240 px per tick, so the scrollbar stays a usable control.
 */
export const MAX_CANVAS_PX = 12_000_000

export interface WindowInput {
  /** The scroller's current `scrollTop`, in canvas pixels. */
  scrollTop: number
  /** The scroller's `clientHeight`. */
  viewportHeight: number
  /** Height of one row, in px. Must be > 0. */
  rowHeight: number
  /** Total rows in the collection being windowed. */
  count: number
  /** Rows rendered beyond each edge of the viewport. */
  overscan: number
  /** Canvas cap; exposed for tests. */
  maxCanvas?: number
}

export interface RowWindow {
  /** First rendered row (inclusive). */
  start: number
  /** Last rendered row (exclusive). */
  end: number
  /** Height of the spacer above the first rendered row, in canvas px. */
  topPad: number
  /** Height of the spacer below the last rendered row, in canvas px. */
  bottomPad: number
  /** Total canvas height — what the scroller's `scrollHeight` should come to. */
  canvasHeight: number
  /** Canvas px per row px. 1 below the cap. */
  scale: number
}

/** The rows to render for a scroll position, and the spacers that place them there. */
export function computeWindow(input: WindowInput): RowWindow {
  const { viewportHeight, rowHeight, count, overscan } = input
  const maxCanvas = input.maxCanvas ?? MAX_CANVAS_PX
  const contentHeight = count * rowHeight
  const canvasHeight = Math.min(contentHeight, maxCanvas)
  if (count === 0) return { start: 0, end: 0, topPad: 0, bottomPad: 0, canvasHeight: 0, scale: 1 }

  // How far the user has scrolled, as a fraction of the scrollable range, is the only
  // quantity that survives the cap: the same fraction of the row space is what they mean.
  const scrollable = Math.max(0, canvasHeight - viewportHeight)
  const scrollTop = Math.max(0, Math.min(input.scrollTop, scrollable))
  const scale = scrollable > 0 ? Math.max(0, contentHeight - viewportHeight) / scrollable : 1
  const contentTop = scrollTop * scale

  const firstVisible = Math.min(count - 1, Math.floor(contentTop / rowHeight))
  const visibleRows = Math.ceil(viewportHeight / rowHeight) + 1
  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(count, firstVisible + visibleRows + overscan)

  // Place the window so that `firstVisible` sits exactly where it would in an uncapped
  // layout relative to the viewport: at the scroll position, minus however far into the
  // row the viewport has already scrolled, minus the overscan rows above it.
  const withinRow = contentTop - firstVisible * rowHeight
  const topPad = Math.max(0, scrollTop - withinRow - (firstVisible - start) * rowHeight)
  const bottomPad = Math.max(0, canvasHeight - topPad - (end - start) * rowHeight)
  return { start, end, topPad, bottomPad, canvasHeight, scale }
}

/**
 * The `scrollTop` that centres `row` in the viewport — the inverse of {@link computeWindow}'s
 * mapping, so a keyboard user landing on a row outside the rendered window is scrolled to
 * it under the same canvas cap. Clamped to the scrollable range.
 */
export function scrollTopForRow(row: number, input: Omit<WindowInput, 'scrollTop'>): number {
  const { viewportHeight, rowHeight, count } = input
  const maxCanvas = input.maxCanvas ?? MAX_CANVAS_PX
  const contentHeight = count * rowHeight
  const canvasHeight = Math.min(contentHeight, maxCanvas)
  const scrollable = Math.max(0, canvasHeight - viewportHeight)
  if (scrollable === 0) return 0
  const scale = Math.max(0, contentHeight - viewportHeight) / scrollable
  const contentTop = Math.max(0, row * rowHeight - (viewportHeight - rowHeight) / 2)
  return Math.max(0, Math.min(scrollable, Math.round(contentTop / scale)))
}
