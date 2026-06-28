export type Vec = readonly [x: number, y: number]

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * Index of the nearest site to (x, y) — i.e. which Voronoi cell the point falls in.
 * Euclidean; returns -1 for an empty set. This is the precise nearest-point lookup
 * for dense scatter/line hover.
 */
export function voronoiFind(sites: readonly Vec[], x: number, y: number): number {
  let best = -1
  let bd = Infinity
  for (let i = 0; i < sites.length; i++) {
    const dx = sites[i]![0] - x
    const dy = sites[i]![1] - y
    const d = dx * dx + dy * dy
    if (d < bd) {
      bd = d
      best = i
    }
  }
  return best
}

/** Sutherland–Hodgman clip of a convex polygon by the half-plane { p : (p - m)·n ≤ 0 }. */
function clipHalfPlane(poly: Vec[], nx: number, ny: number, mx: number, my: number): Vec[] {
  if (poly.length === 0) return poly
  const out: Vec[] = []
  const side = (p: Vec) => (p[0] - mx) * nx + (p[1] - my) * ny
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const sa = side(a)
    const sb = side(b)
    if (sa <= 0) out.push(a)
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb)
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
    }
  }
  return out
}

/**
 * Compute each site's Voronoi cell polygon by clipping `bounds` with the
 * perpendicular bisector against every other site. O(n²) but correct and
 * dependency-free — fine for the hundreds-of-points hover-mesh use case.
 * Returns one polygon (array of points) per site, in site order.
 */
export function voronoiCells(sites: readonly Vec[], bounds: Rect): Vec[][] {
  const rect: Vec[] = [
    [bounds.x0, bounds.y0],
    [bounds.x1, bounds.y0],
    [bounds.x1, bounds.y1],
    [bounds.x0, bounds.y1],
  ]
  return sites.map((s, i) => {
    let poly: Vec[] = rect.slice()
    for (let j = 0; j < sites.length && poly.length > 0; j++) {
      if (j === i) continue
      const t = sites[j]!
      // Keep the half-plane nearer to s: normal points from s toward t, anchored at the midpoint.
      poly = clipHalfPlane(poly, t[0] - s[0], t[1] - s[1], (s[0] + t[0]) / 2, (s[1] + t[1]) / 2)
    }
    return poly
  })
}

/** Render a cell polygon as an SVG path `d` (closed). */
export function cellPath(cell: Vec[]): string {
  if (cell.length === 0) return ''
  return `M${cell.map((p) => `${p[0]},${p[1]}`).join('L')}Z`
}
