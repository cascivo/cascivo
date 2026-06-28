'use client'
import { useSignals, type Signal } from '@cascivo/core'

export interface BrushProps {
  /** Total number of selectable items (data length). */
  count: number
  /** Track height in px. */
  height?: number
  /** [startIndex, endIndex] window, inclusive. The brush mutates this signal. */
  window: Signal<[number, number]>
  /** Accessible label for the range group. */
  label?: string
}

/**
 * A keyboard-operable range selector. Two handles bound to a `[start, end]` window
 * signal; pointer-drag or Arrow/Home/End move them. Resolution-independent (0–100
 * viewBox stretched to the container width) so it tracks the chart's responsive size.
 */
export function Brush({ count, height = 28, window: win, label = 'Range' }: BrushProps) {
  useSignals()
  const n = Math.max(1, count - 1)
  const xOf = (i: number) => (i / n) * 100
  const [s, e] = win.value
  const pad = 3
  const trackY = 4
  const trackH = height - 8

  const move = (which: 0 | 1, idx: number) => {
    const clamped = Math.max(0, Math.min(count - 1, idx))
    const [cs, ce] = win.value
    win.value = which === 0 ? [Math.min(clamped, ce), ce] : [cs, Math.max(clamped, cs)]
  }

  const onMove = (which: 0 | 1) => (ev: React.PointerEvent<SVGRectElement>) => {
    if (ev.buttons !== 1) return
    const svg = ev.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width === 0) return
    move(which, Math.round(((ev.clientX - rect.left) / rect.width) * n))
  }

  const onKey = (which: 0 | 1, idx: number) => (ev: React.KeyboardEvent<SVGRectElement>) => {
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault()
      move(which, idx - 1)
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault()
      move(which, idx + 1)
    } else if (ev.key === 'Home') {
      ev.preventDefault()
      move(which, 0)
    } else if (ev.key === 'End') {
      ev.preventDefault()
      move(which, count - 1)
    }
  }

  const handle = (which: 0 | 1, idx: number) => (
    <rect
      data-brush-handle={which === 0 ? 'start' : 'end'}
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
      onPointerMove={onMove(which)}
      onKeyDown={onKey(which, idx)}
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
        rx={pad}
        fill="var(--cascivo-chart-grid)"
        fillOpacity={0.3}
      />
      <rect
        x={xOf(s)}
        y={trackY}
        width={Math.max(0, xOf(e) - xOf(s))}
        height={trackH}
        fill="var(--cascivo-color-accent)"
        fillOpacity={0.2}
      />
      {handle(0, s)}
      {handle(1, e)}
    </svg>
  )
}
