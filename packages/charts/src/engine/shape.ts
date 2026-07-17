export type Point = readonly [x: number, y: number]

/**
 * Quantize a coordinate to 2 decimal places for SVG emission.
 *
 * Paths built from `Math.sin`/`Math.cos` (arcs, polar points) are not
 * bit-reproducible across JavaScript engines — the server (Node) and the browser
 * can differ in the last floating-point digits, so an SSR-rendered `d`/`x`/`y`
 * attribute won't match the client's first render and React discards the markup
 * ("a tree hydrated but some attributes…"). Arithmetic-only paths (line/area/bar
 * via linear/band scales) are exact everywhere and never need this. Rounding to
 * sub-pixel precision is visually irrelevant and makes the trig chart family
 * (pie, donut, gauge, meter, radial-bar, radar, sunburst, polar) hydrate cleanly.
 */
export function quantize(n: number): number {
  return Math.round(n * 100) / 100
}

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

/** Curve interpolations supported by linePath / areaPath. */
export type Curve =
  | 'linear'
  | 'monotone'
  | 'step'
  | 'stepBefore'
  | 'stepAfter'
  | 'natural'
  | 'basis'
  | 'cardinal'
  | 'catmullRom'

export function linePath(points: readonly Point[], curve: Curve = 'linear'): string {
  if (points.length === 0) return ''
  if (points.length === 1 || curve === 'linear') {
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  }
  switch (curve) {
    case 'monotone':
      return monotonePath(points)
    case 'step':
    case 'stepBefore':
    case 'stepAfter':
      return stepPath(points, curve)
    case 'natural':
      return naturalPath(points)
    case 'basis':
      return basisPath(points)
    case 'cardinal':
      return cardinalPath(points, 0)
    case 'catmullRom':
      return catmullRomPath(points, 0.5)
    default:
      return monotonePath(points)
  }
}

/** Step interpolation — discrete jumps. `stepBefore` changes y before x; `stepAfter` after; `step` at the midpoint. */
function stepPath(points: readonly Point[], kind: 'step' | 'stepBefore' | 'stepAfter'): string {
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    if (kind === 'stepBefore') {
      d += `L${x0},${y1}L${x1},${y1}`
    } else if (kind === 'stepAfter') {
      d += `L${x1},${y0}L${x1},${y1}`
    } else {
      const mx = (x0 + x1) / 2
      d += `L${mx},${y0}L${mx},${y1}L${x1},${y1}`
    }
  }
  return d
}

/** Solve the natural-cubic-spline control points for one coordinate axis (Thomas algorithm). */
function naturalControls(v: number[]): [number[], number[]] {
  const n = v.length - 1
  if (n < 1) return [[], []]
  const a = new Array<number>(n)
  const b = new Array<number>(n)
  const r = new Array<number>(n)
  b[0] = 2
  r[0] = v[0]! + 2 * v[1]!
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1
    b[i] = 4
    r[i] = 4 * v[i]! + 2 * v[i + 1]!
  }
  a[n - 1] = 2
  b[n - 1] = 7
  r[n - 1] = 8 * v[n - 1]! + v[n]!
  for (let i = 1; i < n; i++) {
    const m = (a[i] ?? 0) / b[i - 1]!
    b[i] = b[i]! - m
    r[i] = r[i]! - m * r[i - 1]!
  }
  const p1 = new Array<number>(n)
  const p2 = new Array<number>(n)
  p1[n - 1] = r[n - 1]! / b[n - 1]!
  for (let i = n - 2; i >= 0; i--) p1[i] = (r[i]! - p1[i + 1]!) / b[i]!
  for (let i = 0; i < n - 1; i++) p2[i] = 2 * v[i + 1]! - p1[i + 1]!
  p2[n - 1] = (v[n]! + p1[n - 1]!) / 2
  return [p1, p2]
}

/** Natural cubic spline through the points. */
function naturalPath(points: readonly Point[]): string {
  const n = points.length
  if (n < 3) return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const [px1, px2] = naturalControls(xs)
  const [py1, py2] = naturalControls(ys)
  let d = `M${xs[0]},${ys[0]}`
  for (let i = 0; i < n - 1; i++) {
    d += `C${px1[i]},${py1[i]} ${px2[i]},${py2[i]} ${xs[i + 1]},${ys[i + 1]}`
  }
  return d
}

/** B-spline (basis) — approximating; does not pass through interior points. */
function basisPath(points: readonly Point[]): string {
  const n = points.length
  if (n < 3) return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  const px = (i: number) => points[Math.max(0, Math.min(n - 1, i))]![0]
  const py = (i: number) => points[Math.max(0, Math.min(n - 1, i))]![1]
  let d = `M${px(0)},${py(0)}`
  for (let i = 0; i < n - 1; i++) {
    const x0 = px(i - 1)
    const y0 = py(i - 1)
    const x1 = px(i)
    const y1 = py(i)
    const x2 = px(i + 1)
    const y2 = py(i + 1)
    const c1x = (2 * x0 + x1) / 3
    const c1y = (2 * y0 + y1) / 3
    const c2x = (x0 + 2 * x1) / 3
    const c2y = (y0 + 2 * y1) / 3
    const ex = (x0 + 4 * x1 + x2) / 6
    const ey = (y0 + 4 * y1 + y2) / 6
    d += `C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`
  }
  const last = points[n - 1]!
  d += `L${last[0]},${last[1]}`
  return d
}

/** Cardinal spline through the points (tension 0 = Catmull-Rom uniform). */
function cardinalPath(points: readonly Point[], tension: number): string {
  const n = points.length
  if (n < 3) return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  const k = (1 - tension) / 6
  const p = (i: number) => points[Math.max(0, Math.min(n - 1, i))]!
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = p(i - 1)
    const p1 = p(i)
    const p2 = p(i + 1)
    const p3 = p(i + 2)
    const c1x = p1[0] + k * (p2[0] - p0[0])
    const c1y = p1[1] + k * (p2[1] - p0[1])
    const c2x = p2[0] - k * (p3[0] - p1[0])
    const c2y = p2[1] - k * (p3[1] - p1[1])
    d += `C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
}

/** Centripetal Catmull-Rom spline through the points (alpha 0.5). */
function catmullRomPath(points: readonly Point[], alpha: number): string {
  const n = points.length
  if (n < 3) return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join('')
  const p = (i: number) => points[Math.max(0, Math.min(n - 1, i))]!
  const dist = (a: Point, b: Point) => Math.hypot(b[0] - a[0], b[1] - a[1])
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = p(i - 1)
    const p1 = p(i)
    const p2 = p(i + 1)
    const p3 = p(i + 2)
    const t01 = Math.pow(dist(p0, p1), alpha) || 1e-6
    const t12 = Math.pow(dist(p1, p2), alpha) || 1e-6
    const t23 = Math.pow(dist(p2, p3), alpha) || 1e-6
    const m1x = p2[0] - p1[0] + t12 * ((p1[0] - p0[0]) / t01 - (p2[0] - p0[0]) / (t01 + t12))
    const m1y = p2[1] - p1[1] + t12 * ((p1[1] - p0[1]) / t01 - (p2[1] - p0[1]) / (t01 + t12))
    const m2x = p2[0] - p1[0] + t12 * ((p3[0] - p2[0]) / t23 - (p3[0] - p1[0]) / (t12 + t23))
    const m2y = p2[1] - p1[1] + t12 * ((p3[1] - p2[1]) / t23 - (p3[1] - p1[1]) / (t12 + t23))
    const c1x = p1[0] + m1x / 3
    const c1y = p1[1] + m1y / 3
    const c2x = p2[0] - m2x / 3
    const c2y = p2[1] - m2y / 3
    d += `C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`
  }
  return d
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
  curve: Curve = 'linear',
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
  // Quantize the trig-derived endpoints so server and client emit identical `d`
  // strings (see `quantize`). The radii are integer inputs, left as-is.
  const point = (r: number, angle: number): Point => [
    quantize(cx + r * Math.sin(angle)),
    quantize(cy - r * Math.cos(angle)),
  ]
  const sweep = endAngle - startAngle
  const large = sweep > Math.PI ? 1 : 0
  const oR = quantize(outerRadius)
  const iR = quantize(innerRadius)
  const [ox0, oy0] = point(outerRadius, startAngle)
  const [ox1, oy1] = point(outerRadius, endAngle)
  if (innerRadius <= 0) {
    return `M${quantize(cx)},${quantize(cy)}L${ox0},${oy0}A${oR},${oR} 0 ${large} 1 ${ox1},${oy1}Z`
  }
  const [ix0, iy0] = point(innerRadius, endAngle)
  const [ix1, iy1] = point(innerRadius, startAngle)
  return `M${ox0},${oy0}A${oR},${oR} 0 ${large} 1 ${ox1},${oy1}L${ix0},${iy0}A${iR},${iR} 0 ${large} 0 ${ix1},${iy1}Z`
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
