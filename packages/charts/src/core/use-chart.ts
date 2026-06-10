import { useSignal, useSignalEffect } from '@cascade-ui/core'
import { useRef } from 'react'

export interface ChartSize {
  width: number
  height: number
}

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
    if (typeof ResizeObserver === 'undefined') {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0) width.value = rect.width
      if (rect.height > 0) height.value = rect.height
      return
    }
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { contentRect } = entry
        if (contentRect.width > 0) width.value = contentRect.width
        if (contentRect.height > 0) height.value = contentRect.height
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  })

  return { ref, width, height }
}

export const DEFAULT_MARGINS = { top: 8, right: 8, bottom: 24, left: 36 } as const
