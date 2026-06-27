'use client'
import type { ReactNode } from 'react'

export type GlyphShape = 'circle' | 'square' | 'diamond' | 'triangle' | 'cross' | 'star'

/**
 * Centered path `d` for a glyph of the given pixel `size` (full width/height).
 * `circle` returns an empty string — render a `<circle>` for crispness instead.
 */
export function glyphPath(shape: GlyphShape, size: number): string {
  const r = size / 2
  switch (shape) {
    case 'square':
      return `M${-r},${-r}h${size}v${size}h${-size}Z`
    case 'diamond':
      return `M0,${-r}L${r},0L0,${r}L${-r},0Z`
    case 'triangle':
      return `M0,${-r}L${r},${r}L${-r},${r}Z`
    case 'cross': {
      const a = r * 0.4 // arm half-width
      return (
        `M${-a},${-r}h${2 * a}v${r - a}h${r - a}v${2 * a}h${-(r - a)}v${r - a}` +
        `h${-2 * a}v${-(r - a)}h${-(r - a)}v${-2 * a}h${r - a}Z`
      )
    }
    case 'star': {
      const pts: string[] = []
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.4
        const angle = (Math.PI / 5) * i - Math.PI / 2
        pts.push(
          `${(Math.cos(angle) * radius).toFixed(3)},${(Math.sin(angle) * radius).toFixed(3)}`,
        )
      }
      return `M${pts.join('L')}Z`
    }
    case 'circle':
    default:
      return ''
  }
}

export interface GlyphProps {
  shape: GlyphShape
  x: number
  y: number
  size: number
  color: string
  opacity?: number
  stroke?: string
  strokeWidth?: number
}

/** A single point glyph, centered at (x, y). Decorative — the value lives in the a11y tree. */
export function Glyph({
  shape,
  x,
  y,
  size,
  color,
  opacity = 0.85,
  stroke,
  strokeWidth,
}: GlyphProps): ReactNode {
  const common = {
    fill: color,
    fillOpacity: opacity,
    ...(stroke != null && { stroke }),
    ...(strokeWidth != null && { strokeWidth }),
    'aria-hidden': true as const,
    'data-glyph': shape,
  }
  if (shape === 'circle') {
    return <circle cx={x} cy={y} r={size / 2} {...common} />
  }
  return <path d={glyphPath(shape, size)} transform={`translate(${x},${y})`} {...common} />
}
