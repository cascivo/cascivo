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
const AXIS_CHAR_PX = 6.5

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
 * Stride for a crowded categorical (band) axis: render every Nth label so they stop
 * colliding (e.g. 14 `Jul 1`…`Jul 14` dates in a narrow chart). Returns `undefined`
 * when every label fits — callers pass that straight to `Axis.labelEvery` (all shown).
 * An explicit `xLabelEvery` from the caller always overrides this.
 */
export function autoLabelStride(labels: readonly string[], axisLength: number): number | undefined {
  if (labels.length <= 1 || axisLength <= 0) return undefined
  const band = axisLength / labels.length
  const widest = labels.reduce((m, s) => Math.max(m, s.length), 0) * AXIS_CHAR_PX + 6
  if (band >= widest) return undefined
  return Math.ceil(widest / band)
}
