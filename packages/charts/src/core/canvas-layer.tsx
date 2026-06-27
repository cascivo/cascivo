'use client'
import { useSignalEffect } from '@cascivo/core'
import { useRef, type ReactNode } from 'react'

export interface CanvasSize {
  width: number
  height: number
}

export type CanvasPaint = (ctx: CanvasRenderingContext2D, size: CanvasSize) => void

export interface CanvasLayerProps {
  /** Getter that reads the (possibly signal-backed) size so a resize repaints. */
  size: () => CanvasSize
  paint: CanvasPaint
}

/**
 * A `<canvas>` painted via `useSignalEffect`, positioned to overlay the plot. The
 * size getter reads the chart's size signals, so a resize (or any signal the paint
 * reads) repaints. Decorative — `aria-hidden`; the data lives in the SVG/DOM a11y
 * tree above it. devicePixelRatio-scaled for crisp marks.
 */
export function CanvasLayer({ size, paint }: CanvasLayerProps): ReactNode {
  const ref = useRef<HTMLCanvasElement>(null)

  useSignalEffect(() => {
    const { width, height } = size() // reads size signals → repaint on resize
    const canvas = ref.current
    if (!canvas || width <= 0 || height <= 0) return
    const dpr =
      typeof globalThis !== 'undefined' && 'devicePixelRatio' in globalThis
        ? (globalThis.devicePixelRatio as number) || 1
        : 1
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    paint(ctx, { width, height })
  })

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-canvas-layer=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

/** Resolve a CSS custom property (e.g. `--cascivo-chart-1`) to a concrete color via the canvas element. */
export function resolveColor(ctx: CanvasRenderingContext2D, cssValue: string): string {
  const match = /var\((--[^,)]+)/.exec(cssValue)
  if (!match || typeof getComputedStyle !== 'function') return cssValue
  const resolved = getComputedStyle(ctx.canvas).getPropertyValue(match[1]!).trim()
  return resolved || cssValue
}
