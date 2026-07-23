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
