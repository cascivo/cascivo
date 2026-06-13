import type { ChartPoint } from './data-point'

/** Strategy for nearest-point lookup:
 * - 'x': find nearest by x-coordinate only (time-series, line charts)
 * - 'xy': find nearest by 2D Euclidean distance (scatter, bubble)
 */
export type NearestStrategy = 'x' | 'xy'

/** Find the index of the nearest ChartPoint to the given pixel position.
 * Returns -1 if points is empty. */
export function nearest(
  points: ChartPoint[],
  px: number,
  py: number,
  strategy: NearestStrategy = 'xy',
): number {
  if (points.length === 0) return -1
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const dist = strategy === 'x' ? Math.abs(p.cx - px) : Math.hypot(p.cx - px, p.cy - py)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}
