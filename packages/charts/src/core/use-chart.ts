import { useSignal, useSignalEffect } from '@cascivo/core'
import { useRef } from 'react'

export interface ChartSize {
  width: number
  height: number
}

/**
 * Measure a container and track its size in signals. **Every cascivo chart already
 * uses this internally** — charts are responsive by default and fill their
 * container, so you do NOT need this to make a chart responsive (just omit the
 * chart's `width`). Reach for it only to size *another* element to match a chart,
 * or to build a custom chart on the same measurement primitive.
 *
 * Returns `{ ref, width, height }`: spread `ref` onto the element to measure; read
 * `width.value` / `height.value` (they update on resize via a `ResizeObserver`,
 * deferred one frame to avoid the "ResizeObserver loop" warning). Under SSR (no
 * `ResizeObserver`) it falls back to a single `getBoundingClientRect()` read, so
 * the first paint has a sensible size. `defaultWidth` seeds the signal only until
 * the first real measurement lands.
 */
export function useChartSize(
  defaultWidth = 400,
  defaultHeight = 300,
): {
  ref: React.RefObject<HTMLDivElement | null>
  width: import('@preact/signals-react').Signal<number>
  height: import('@preact/signals-react').Signal<number>
} {
  const ref = useRef<HTMLDivElement>(null)
  const width = useSignal(defaultWidth)
  const height = useSignal(defaultHeight)

  useSignalEffect(() => {
    const el = ref.current
    if (!el) return

    // Skip no-op writes so an unchanged measurement can't re-trigger the observer.
    // `.peek()` reads without subscribing the effect to its own writes.
    const apply = (w: number, h: number) => {
      if (w > 0 && w !== width.peek()) width.value = w
      if (h > 0 && h !== height.peek()) height.value = h
    }

    if (typeof ResizeObserver === 'undefined') {
      const rect = el.getBoundingClientRect()
      apply(rect.width, rect.height)
      return
    }

    let raf = 0
    const ro = new ResizeObserver((entries) => {
      // Defer the signal writes out of the observer callback. Writing synchronously
      // re-renders the observed subtree (the SVG box lives inside the observed div),
      // which the browser reports as "ResizeObserver loop completed with undelivered
      // notifications". Hopping to the next frame breaks that same-frame
      // observe → write → relayout → observe cycle.
      const entry = entries[entries.length - 1]
      if (!entry) return
      const { width: w, height: h } = entry.contentRect
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => apply(w, h))
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  })

  return { ref, width, height }
}

export const DEFAULT_MARGINS = { top: 8, right: 8, bottom: 24, left: 36 } as const

/** Margins for plain (chrome-less) charts — just enough to keep strokes unclipped. */
export const PLAIN_MARGINS = { top: 2, right: 2, bottom: 2, left: 2 } as const

/**
 * Approximate advance width (px) of one axis-label character at the 11px axis font.
 * A conservative average across digits, separators, and short month names — good
 * enough to reserve room without measuring text (no DOM in SSR/tests).
 */
export const AXIS_CHAR_PX = 6.5

/**
 * Left margin sized to the widest left-axis label so wide ticks (e.g. `40,000`)
 * aren't clipped past the SVG's `0` origin. The default 36px only fits ~4 glyphs;
 * a 6-glyph thousands label needs ~45px. `plain` charts keep their tiny margin.
 */
export function leftMarginForLabels(
  leftAxisLabels: readonly string[],
  plain: boolean | undefined,
): number {
  if (plain) return PLAIN_MARGINS.left
  const widestChars = leftAxisLabels.reduce((m, s) => Math.max(m, s.length), 0)
  const gutter = 12 // tick line (8px) + breathing room
  return Math.max(DEFAULT_MARGINS.left, Math.ceil(widestChars * AXIS_CHAR_PX + gutter))
}

/**
 * Right margin sized so the axis chrome on the right-hand side isn't clipped by the SVG
 * edge. Two independent causes, both of which the default 8px margin failed:
 *
 * - a **right-hand value axis** (`secondAxis`) needs the full width of its widest label,
 *   which renders *outside* the plot via `Axis orientation="y-right"`;
 * - the **final bottom-axis label** is centred on the last tick, which sits at the plot's
 *   right edge, so half of it overhangs (`7/26/2026` → `7/26/202`).
 *
 * Pass whichever apply; the larger wins. `plain` charts keep their tiny margin.
 */
export function rightMarginForLabels(
  options: {
    /** Labels of a right-hand value axis, if the chart has one. */
    rightAxisLabels?: readonly string[]
    /** Labels of the bottom axis — only the last one's overhang matters. */
    bottomAxisLabels?: readonly string[]
    /** Whether the right axis also draws a rotated title outside its tick labels. */
    rightAxisTitle?: boolean
    plain?: boolean | undefined
  } = {},
): number {
  const { rightAxisLabels = [], bottomAxisLabels = [], rightAxisTitle = false, plain } = options
  if (plain) return PLAIN_MARGINS.right
  const gutter = 12 // tick line (8px) + breathing room
  const rightAxis = rightAxisLabels.reduce((m, s) => Math.max(m, s.length), 0)
  // A rotated axis title sits outside the tick labels, so it needs its own line box plus
  // clearance from the widest tick — otherwise it renders on top of them or off the SVG.
  const titlePx = rightAxisTitle ? AXIS_LINE_PX + 6 : 0
  const rightAxisPx = rightAxis > 0 ? Math.ceil(rightAxis * AXIS_CHAR_PX + gutter + titlePx) : 0
  // Only the last bottom label overhangs, and only by half its width.
  const lastBottom = bottomAxisLabels[bottomAxisLabels.length - 1] ?? ''
  const overhangPx = lastBottom ? Math.ceil((lastBottom.length * AXIS_CHAR_PX) / 2 + 2) : 0
  return Math.max(DEFAULT_MARGINS.right, rightAxisPx, overhangPx)
}

/**
 * Approximate block size (px) of one axis label at the 11px axis font — the line box
 * plus a little separation. What crowds labels stacked down a y-axis is their *height*,
 * not the length of the text.
 */
export const AXIS_LINE_PX = 14

/**
 * Stride for a crowded categorical (band) axis: render every Nth label so they stop
 * colliding (e.g. 14 `Jul 1`…`Jul 14` dates in a narrow chart). Returns `undefined`
 * when every label fits — callers pass that straight to `Axis.labelEvery` (all shown).
 * An explicit `xLabelEvery` from the caller always overrides this.
 *
 * `direction` says which way the labels are laid out along the axis, and therefore which
 * dimension of the label competes for the band:
 *
 * - `'horizontal'` (a bottom category axis) — labels sit side by side, so the constraint
 *   is text *width*, estimated from the character count.
 * - `'vertical'` (a horizontal bar chart's category axis, which runs down the y-axis) —
 *   labels stack, so the constraint is line *height*, which is the same for every label.
 *
 * Measuring the vertical case against text width is the bug this parameter fixes: seven
 * categories down a 240px axis were strided away as "crowded" because one of them was
 * eight characters long, which is not a fact about vertical space at all.
 *
 * `Axis` always draws the final label, and drops the strided label before it when the two
 * would collide — so a stride that doesn't divide the domain evenly is safe.
 */
export function autoLabelStride(
  labels: readonly string[],
  axisLength: number,
  direction: 'horizontal' | 'vertical' = 'horizontal',
): number | undefined {
  if (labels.length <= 1 || axisLength <= 0) return undefined
  const band = axisLength / labels.length
  const needed =
    direction === 'vertical'
      ? AXIS_LINE_PX
      : labels.reduce((m, s) => Math.max(m, s.length), 0) * AXIS_CHAR_PX + 6
  if (band >= needed) return undefined
  return Math.ceil(needed / band)
}
