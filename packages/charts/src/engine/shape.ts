export type Point = readonly [x: number, y: number]

/**
 * Split a list of points (where `null` marks a gap / missing value) into
 * contiguous defined runs. With `connectNulls`, drops the gaps and returns one
 * run bridging them. A series `[a, null, b]` yields `[[a], [b]]` by default,
 * or `[[a, b]]` when connecting — so a gap renders as a real break, not an
 * invented straight segment.
 */
export function splitDefined(points: readonly (Point | null)[], connectNulls = false): Point[][] {
  if (connectNulls) {
    const kept = points.filter((p): p is Point => p !== null)
    return kept.length > 0 ? [kept] : []
  }
  const runs: Point[][] = []
  let current: Point[] = []
  for (const p of points) {
    if (p === null) {
      if (current.length > 0) runs.push(current)
      current = []
    } else {
      current.push(p)
    }
  }
  if (current.length > 0) runs.push(current)
  return runs
}

export function linePath(
  points: readonly Point[],
  curve: 'linear' | 'monotone' = 'linear',
): string {
  if (points.length === 0) return ''
  if (points.length === 1 || curve === 'linear') {
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  }
  return monotonePath(points)
}

function monotonePath(points: readonly Point[]): string {
  const n = points.length
  const dx: number[] = []
  const dy: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1]![0] - points[i]![0]
    dy[i] = points[i + 1]![1] - points[i]![1]
    slope[i] = dx[i] === 0 ? 0 : dy[i]! / dx[i]!
  }
  const tangent: number[] = [slope[0] ?? 0]
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!
    const b = slope[i]!
    tangent[i] = a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  }
  tangent[n - 1] = slope[n - 2] ?? 0
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    const h = (x1 - x0) / 3
    d += `C${x0 + h},${y0 + h * tangent[i]!} ${x1 - h},${y1 - h * tangent[i + 1]!} ${x1},${y1}`
  }
  return d
}

export function areaPath(
  points: readonly Point[],
  baseline: number,
  curve: 'linear' | 'monotone' = 'linear',
): string {
  if (points.length === 0) return ''
  const top = linePath(points, curve)
  const last = points[points.length - 1]!
  const first = points[0]!
  return `${top}L${last[0]},${baseline}L${first[0]},${baseline}Z`
}

export function arcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const TWO_PI = 2 * Math.PI
  // Full circle: split into two arcs to avoid degenerate SVG arc
  if (Math.abs(endAngle - startAngle) >= TWO_PI - 1e-9) {
    const mid = startAngle + Math.PI
    const p1 = arcPath(cx, cy, outerRadius, innerRadius, startAngle, mid)
    const p2 = arcPath(cx, cy, outerRadius, innerRadius, mid, startAngle + TWO_PI - 1e-9)
    return p1 + p2
  }
  const point = (r: number, angle: number): Point => [
    cx + r * Math.sin(angle),
    cy - r * Math.cos(angle),
  ]
  const sweep = endAngle - startAngle
  const large = sweep > Math.PI ? 1 : 0
  const [ox0, oy0] = point(outerRadius, startAngle)
  const [ox1, oy1] = point(outerRadius, endAngle)
  if (innerRadius <= 0) {
    return `M${cx},${cy}L${ox0},${oy0}A${outerRadius},${outerRadius} 0 ${large} 1 ${ox1},${oy1}Z`
  }
  const [ix0, iy0] = point(innerRadius, endAngle)
  const [ix1, iy1] = point(innerRadius, startAngle)
  return `M${ox0},${oy0}A${outerRadius},${outerRadius} 0 ${large} 1 ${ox1},${oy1}L${ix0},${iy0}A${innerRadius},${innerRadius} 0 ${large} 0 ${ix1},${iy1}Z`
}

export function stackSeries(series: readonly (readonly number[])[]): [number, number][][] {
  const length = series[0]?.length ?? 0
  const totals = Array.from({ length }, () => 0)
  return series.map((values) =>
    values.map((value, i) => {
      const y0 = totals[i]!
      totals[i] = y0 + value
      return [y0, totals[i]!] as [number, number]
    }),
  )
}
