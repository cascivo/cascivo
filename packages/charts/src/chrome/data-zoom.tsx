'use client'
import { useSignals, useSignal, type Signal } from '@cascivo/core'

export interface DataZoomProps {
  /** Total number of selectable items (data length). */
  count: number
  /** Track height in px. */
  height?: number
  /** [startIndex, endIndex] window, inclusive. The control mutates this signal. */
  window: Signal<[number, number]>
  /** Accessible label for the range group. */
  label?: string
}

/**
 * A dataZoom slider — the v52 Brush plus a draggable **body** that pans the whole
 * window (drag it, or Arrow it with the body focused) while the two handles resize
 * it. Bound to a `[start, end]` window signal; resolution-independent (0–100 viewBox).
 */
export function DataZoom({ count, height = 28, window: win, label = 'Range' }: DataZoomProps) {
  useSignals()
  const n = Math.max(1, count - 1)
  const xOf = (i: number) => (i / n) * 100
  const [s, e] = win.value
  const trackY = 4
  const trackH = height - 8
  const grabOffset = useSignal(0)

  const idxAt = (clientX: number, svg: SVGSVGElement): number => {
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return 0
    return Math.round(((clientX - rect.left) / rect.width) * n)
  }

  const resize = (which: 0 | 1, idx: number) => {
    const clamped = Math.max(0, Math.min(count - 1, idx))
    const [cs, ce] = win.value
    win.value = which === 0 ? [Math.min(clamped, ce), ce] : [cs, Math.max(clamped, cs)]
  }

  /** Pan the window to a new start, preserving its width and clamping to [0, count-1]. */
  const panTo = (start: number) => {
    const [cs, ce] = win.value
    const width = ce - cs
    const ns = Math.max(0, Math.min(count - 1 - width, start))
    win.value = [ns, ns + width]
  }

  const onResizeMove = (which: 0 | 1) => (ev: React.PointerEvent<SVGRectElement>) => {
    if (ev.buttons !== 1 || !ev.currentTarget.ownerSVGElement) return
    resize(which, idxAt(ev.clientX, ev.currentTarget.ownerSVGElement))
  }

  const onHandleKey = (which: 0 | 1, idx: number) => (ev: React.KeyboardEvent<SVGRectElement>) => {
    const k = ev.key
    if (k === 'ArrowLeft') (ev.preventDefault(), resize(which, idx - 1))
    else if (k === 'ArrowRight') (ev.preventDefault(), resize(which, idx + 1))
    else if (k === 'Home') (ev.preventDefault(), resize(which, 0))
    else if (k === 'End') (ev.preventDefault(), resize(which, count - 1))
  }

  const handle = (which: 0 | 1, idx: number) => (
    <rect
      data-zoom-handle={which === 0 ? 'start' : 'end'}
      role="slider"
      tabIndex={0}
      aria-label={`${label} ${which === 0 ? 'start' : 'end'}`}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={idx}
      x={xOf(idx) - 0.8}
      y={0}
      width={1.6}
      height={height}
      rx={0.6}
      fill="var(--cascivo-color-accent)"
      style={{ cursor: 'ew-resize', touchAction: 'none' }}
      onPointerDown={(ev) => ev.currentTarget.setPointerCapture(ev.pointerId)}
      onPointerMove={onResizeMove(which)}
      onKeyDown={onHandleKey(which, idx)}
    />
  )

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      role="group"
      aria-label={`${label} — showing ${s + 1}–${e + 1} of ${count}`}
      style={{ display: 'block', touchAction: 'none' }}
    >
      <rect
        x={0}
        y={trackY}
        width={100}
        height={trackH}
        rx={3}
        fill="var(--cascivo-chart-grid)"
        fillOpacity={0.3}
      />
      {/* draggable body — pan the window */}
      <rect
        data-zoom-body=""
        role="slider"
        tabIndex={0}
        aria-label={`${label} window`}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={s}
        x={xOf(s)}
        y={trackY}
        width={Math.max(0, xOf(e) - xOf(s))}
        height={trackH}
        fill="var(--cascivo-color-accent)"
        fillOpacity={0.2}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={(ev) => {
          const svg = ev.currentTarget.ownerSVGElement
          if (svg) grabOffset.value = idxAt(ev.clientX, svg) - win.value[0]
          ev.currentTarget.setPointerCapture(ev.pointerId)
        }}
        onPointerMove={(ev) => {
          if (ev.buttons !== 1 || !ev.currentTarget.ownerSVGElement) return
          panTo(idxAt(ev.clientX, ev.currentTarget.ownerSVGElement) - grabOffset.value)
        }}
        onKeyDown={(ev) => {
          if (ev.key === 'ArrowLeft') (ev.preventDefault(), panTo(win.value[0] - 1))
          else if (ev.key === 'ArrowRight') (ev.preventDefault(), panTo(win.value[0] + 1))
        }}
      />
      {handle(0, s)}
      {handle(1, e)}
    </svg>
  )
}
