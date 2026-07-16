/**
 * A reusable polar coordinate system — angle + radius scales and the (angle, radius)
 * → (x, y) conversion shared by the Polar chart and Gauge. Angles follow the same
 * convention as `arcPath`: 0 points up (north) and increases clockwise, in radians.
 */
import { linearScale, type LinearScale } from './scale'
import { quantize } from './shape'

/**
 * Convert a polar (radius, angle) around a centre to cartesian (x, y).
 *
 * The result is quantized (see `quantize` in ./shape) because it is built from
 * `Math.sin`/`Math.cos`, which are not bit-reproducible across JS engines — this
 * keeps SSR and client renders of gauge/polar/radar coordinates identical.
 */
export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): [number, number] {
  return [quantize(cx + radius * Math.sin(angle)), quantize(cy - radius * Math.cos(angle))]
}

export interface AngleBand<T extends string = string> {
  /** Start angle (radians) of a category's band. */
  map: (v: T) => number | undefined
  /** Centre angle (radians) of a category's band. */
  center: (v: T) => number | undefined
  /** Angular width of one band (radians). */
  bandwidth: number
  /** Step between band starts (radians) — equals bandwidth for a gapless ring. */
  step: number
}

/**
 * A band scale over the circle: maps categories to equal angular slices spanning
 * `[a0, a1]` (radians, default a full turn).
 */
export function angleBand<T extends string>(
  domain: readonly T[],
  range: [number, number] = [0, 2 * Math.PI],
): AngleBand<T> {
  const n = Math.max(1, domain.length)
  const step = (range[1] - range[0]) / n
  const index = new Map<T, number>(domain.map((d, i) => [d, i]))
  const start = (v: T) => {
    const i = index.get(v)
    return i === undefined ? undefined : range[0] + i * step
  }
  return {
    map: start,
    center: (v) => {
      const s = start(v)
      return s === undefined ? undefined : s + step / 2
    },
    bandwidth: step,
    step,
  }
}

/** A linear radius scale: value domain → `[innerR, outerR]` pixels. */
export function radiusScale(domain: [number, number], range: [number, number]): LinearScale {
  return linearScale(domain, range)
}
