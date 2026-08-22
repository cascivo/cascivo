'use client'
import type { ReactNode } from 'react'

let measureCtx: CanvasRenderingContext2D | null | undefined

/** Measure text width with a shared offscreen canvas; falls back to a char estimate (jsdom/SSR). */
function measureWidth(text: string, fontSize: number): number {
  if (measureCtx === undefined) {
    measureCtx =
      typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  }
  if (measureCtx) {
    measureCtx.font = `${fontSize}px sans-serif`
    const w = measureCtx.measureText(text).width
    if (w > 0) return w
  }
  return text.length * fontSize * 0.55
}

/** Greedily wrap `text` to lines no wider than `maxWidth` (px) at the given font size. */
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  if (!maxWidth || maxWidth <= 0) return [text]
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && measureWidth(candidate, fontSize) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : [text]
}

export interface ChartTextProps {
  x: number
  y: number
  children: string
  /** Max line width in px; when set, the text wraps into `<tspan>` lines. */
  width?: number
  fontSize?: number
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
  lineHeight?: number
  className?: string
}

/**
 * An SVG `<text>` primitive that wraps to a max width (canvas-measured, with a char
 * fallback). The `@visx/text` analogue — used by `Axis` for long category labels and
 * available to custom charts.
 *
 * Named `ChartText`, not `Text`: `@cascivo/react` also exports a `Text` (the typography
 * component), and a dashboard file importing from both packages is the normal case. The
 * collision resolved silently — the wrong `Text` renders an SVG node where a paragraph was
 * meant, with no error — and it was the last one in the catalog after `Calendar` became
 * `CalendarHeatmap` (2026-08-22 report item 20).
 */
export function ChartText({
  x,
  y,
  children,
  width,
  fontSize = 12,
  anchor = 'start',
  fill,
  lineHeight = 1.2,
  className,
}: ChartTextProps): ReactNode {
  const lines = width ? wrapText(children, width, fontSize) : [children]
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      textAnchor={anchor}
      {...(fill != null && { fill })}
      {...(className != null && { className })}
    >
      {lines.map((ln, i) => (
        <tspan key={i} x={x} {...(i > 0 && { dy: `${lineHeight}em` })}>
          {ln}
        </tspan>
      ))}
    </text>
  )
}

/**
 * @deprecated Use `ChartText`. This name collides with `@cascivo/react`'s typography
 * component, and the wrong resolution is silent. Removed at 1.0 — the release cadence is
 * roughly weekly, so a one-minor window would be about five days, which is a break with extra
 * steps rather than a deprecation.
 */
export const Text = ChartText

/** @deprecated Use `ChartTextProps`. */
export type TextProps = ChartTextProps
