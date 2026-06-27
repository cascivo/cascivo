/**
 * Pure index-window math shared by the DataZoom slider and the in-plot wheel/drag
 * zoom-pan. A "window" is an inclusive `[startIndex, endIndex]` over a series of
 * `count` items; charts slice their data to it so the axes re-tick for free.
 */

/** Smallest window span (keep at least two points so a line/area still renders). */
const MIN_SPAN = 1

/**
 * Zoom a window toward an anchor expressed as a fraction (0–1) across the current
 * window. `factor < 1` zooms in (narrows), `factor > 1` zooms out (widens). The
 * result is rounded to integer indices and clamped to `[0, count-1]` with a
 * minimum span.
 */
export function zoomWindow(
  win: readonly [number, number],
  count: number,
  factor: number,
  anchorFraction: number,
): [number, number] {
  if (count <= 1) return [0, Math.max(0, count - 1)]
  const [s, e] = win
  const span = e - s
  const anchor = s + anchorFraction * span
  let ns = Math.round(anchor - (anchor - s) * factor)
  let ne = Math.round(anchor + (e - anchor) * factor)
  ns = Math.max(0, ns)
  ne = Math.min(count - 1, ne)
  if (ne - ns < MIN_SPAN) {
    // Re-expand around the anchor to preserve a usable span.
    const mid = Math.round(anchor)
    ns = Math.max(0, Math.min(mid - 1, count - 1 - MIN_SPAN))
    ne = Math.min(count - 1, ns + MIN_SPAN)
  }
  return [ns, ne]
}

/**
 * Pan a window by a (possibly fractional) index delta, preserving its width and
 * clamping to `[0, count-1]`.
 */
export function panWindow(
  win: readonly [number, number],
  count: number,
  deltaIdx: number,
): [number, number] {
  const [s, e] = win
  const span = e - s
  const ns = Math.max(0, Math.min(count - 1 - span, Math.round(s + deltaIdx)))
  return [ns, ns + span]
}

/** Whether a window is anything other than the full `[0, count-1]` range. */
export function isZoomed(win: readonly [number, number], count: number): boolean {
  return win[0] > 0 || win[1] < count - 1
}
