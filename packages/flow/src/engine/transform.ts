import type { Viewport, XYPosition } from './types.ts'

/** Clamp a zoom level into the allowed range. */
export function clampZoom(zoom: number, min = 0.2, max = 2): number {
  return Math.min(max, Math.max(min, zoom))
}

/**
 * Convert a screen-space point (relative to the pane origin) into flow
 * coordinates. Inverse of `flowToScreen`. The pane applies
 * `translate(viewport.x, viewport.y) scale(viewport.zoom)` with origin `0 0`,
 * so a flow point maps to `p * zoom + translate`.
 */
export function screenToFlow(point: XYPosition, viewport: Viewport): XYPosition {
  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  }
}

/** Convert a flow-space point into screen coordinates (relative to the pane origin). */
export function flowToScreen(point: XYPosition, viewport: Viewport): XYPosition {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  }
}
