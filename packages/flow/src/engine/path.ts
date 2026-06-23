import type { EdgePathType, HandlePosition, XYPosition } from './types.ts'

export interface EdgePathParams {
  source: XYPosition
  target: XYPosition
  sourcePosition?: HandlePosition
  targetPosition?: HandlePosition
}

export interface EdgePath {
  /** The SVG `d` attribute. */
  d: string
  /** The path midpoint — where an edge label is placed. */
  mid: XYPosition
}

const n = (v: number): string =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '')

const midpoint = (a: XYPosition, b: XYPosition): XYPosition => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
})

/** Unit direction pointing outward from a handle on the given side. */
function normal(position: HandlePosition): XYPosition {
  switch (position) {
    case 'top':
      return { x: 0, y: -1 }
    case 'bottom':
      return { x: 0, y: 1 }
    case 'left':
      return { x: -1, y: 0 }
    case 'right':
      return { x: 1, y: 0 }
  }
}

/** A straight line from source to target. */
export function straightPath({ source, target }: EdgePathParams): EdgePath {
  return {
    d: `M${n(source.x)},${n(source.y)} L${n(target.x)},${n(target.y)}`,
    mid: midpoint(source, target),
  }
}

/**
 * A cubic-bezier edge with control points offset along each handle's outward
 * normal. `curvature` scales the control distance relative to the endpoint gap.
 */
export function bezierPath(params: EdgePathParams & { curvature?: number }): EdgePath {
  const { source, target, curvature = 0.25 } = params
  const sourcePosition = params.sourcePosition ?? 'right'
  const targetPosition = params.targetPosition ?? 'left'
  const dist = Math.hypot(target.x - source.x, target.y - source.y)
  const offset = Math.max(curvature * dist, 20)
  const sn = normal(sourcePosition)
  const tn = normal(targetPosition)
  const c1 = { x: source.x + sn.x * offset, y: source.y + sn.y * offset }
  const c2 = { x: target.x + tn.x * offset, y: target.y + tn.y * offset }
  // Cubic bezier point at t = 0.5.
  const mid = {
    x: (source.x + 3 * c1.x + 3 * c2.x + target.x) / 8,
    y: (source.y + 3 * c1.y + 3 * c2.y + target.y) / 8,
  }
  return {
    d: `M${n(source.x)},${n(source.y)} C${n(c1.x)},${n(c1.y)} ${n(c2.x)},${n(c2.y)} ${n(target.x)},${n(target.y)}`,
    mid,
  }
}

function len(a: XYPosition, b: XYPosition): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function towards(from: XYPosition, to: XYPosition, d: number): XYPosition {
  const l = len(from, to) || 1
  return { x: from.x + ((to.x - from.x) / l) * d, y: from.y + ((to.y - from.y) / l) * d }
}

/** Build an orthogonal polyline through `points`, rounding interior corners. */
function roundedPath(points: XYPosition[], radius: number): string {
  if (points.length < 2) return ''
  const first = points[0]!
  let d = `M${n(first.x)},${n(first.y)}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]!
    const r = Math.min(radius, len(prev, curr) / 2, len(curr, next) / 2)
    const a = towards(curr, prev, r)
    const b = towards(curr, next, r)
    d += ` L${n(a.x)},${n(a.y)} Q${n(curr.x)},${n(curr.y)} ${n(b.x)},${n(b.y)}`
  }
  const last = points[points.length - 1]!
  d += ` L${n(last.x)},${n(last.y)}`
  return d
}

/**
 * An orthogonal "step" edge with rounded corners. Splits perpendicular to the
 * source handle's orientation (horizontal handle → vertical split, and vice versa).
 */
export function smoothStepPath(params: EdgePathParams & { borderRadius?: number }): EdgePath {
  const { source, target, borderRadius = 8 } = params
  const sourcePosition = params.sourcePosition ?? 'right'
  const horizontal = sourcePosition === 'left' || sourcePosition === 'right'

  const waypoints: XYPosition[] = [source]
  if (horizontal) {
    const cx = (source.x + target.x) / 2
    waypoints.push({ x: cx, y: source.y }, { x: cx, y: target.y })
  } else {
    const cy = (source.y + target.y) / 2
    waypoints.push({ x: source.x, y: cy }, { x: target.x, y: cy })
  }
  waypoints.push(target)

  return { d: roundedPath(waypoints, borderRadius), mid: midpoint(source, target) }
}

/** Dispatch to the builder for `type`. */
export function edgePath(type: EdgePathType, params: EdgePathParams): EdgePath {
  switch (type) {
    case 'straight':
      return straightPath(params)
    case 'smoothstep':
      return smoothStepPath(params)
    case 'bezier':
      return bezierPath(params)
  }
}
