export interface LinearScale {
  domain: [number, number]
  range: [number, number]
  map(value: number): number
  invert(position: number): number
  ticks(count?: number): number[]
}

export function linearScale(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  return {
    domain,
    range,
    map: (value) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0)),
    invert: (position) => (r1 - r0 === 0 ? d0 : d0 + ((position - r0) / (r1 - r0)) * span),
    ticks: (count = 5) => niceTicks(d0, d1, count),
  }
}

/** Extended nice-numbers: steps are 1, 2, 2.5 or 5 × 10^k covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min]
  if (min > max) [min, max] = [max, min]
  const rawStep = (max - min) / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const candidates = [1, 2, 2.5, 5, 10]
  const mantissa = rawStep / magnitude
  const step = (candidates.find((c) => c >= mantissa) ?? 10) * magnitude
  const startIdx = Math.ceil(min / step)
  const endIdx = Math.floor(max / step + 1e-9)
  const ticks: number[] = []
  // Round to avoid float noise from large-integer × small-step multiplication
  const precision = Math.max(0, Math.ceil(-Math.log10(step)) + 2)
  for (let i = startIdx; i <= endIdx; i++) {
    ticks.push(parseFloat((i * step).toFixed(precision)))
  }
  return ticks
}

export interface BandScale<T extends string = string> {
  domain: readonly T[]
  range: [number, number]
  bandwidth: number
  map(value: T): number | undefined
}

export function bandScale<T extends string>(
  domain: readonly T[],
  range: [number, number],
  padding = 0.1,
): BandScale<T> {
  const [r0, r1] = range
  const n = domain.length
  const step = (r1 - r0) / Math.max(1, n + padding * (n + 1))
  const bandwidth = step
  const offset = step * padding
  const index = new Map(domain.map((d, i) => [d, i]))
  return {
    domain,
    range,
    bandwidth,
    map: (value) => {
      const i = index.get(value)
      return i === undefined ? undefined : r0 + offset + i * (step + offset)
    },
  }
}

/** Square-root scale for area-proportional bubble sizes. Maps values in sqrt space. */
export function sqrtScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const sqrtD0 = Math.sqrt(Math.max(0, d0))
  const sqrtD1 = Math.sqrt(Math.max(0, d1))
  const span = sqrtD1 - sqrtD0
  return (value) => {
    if (span === 0) return (r0 + r1) / 2
    return r0 + ((Math.sqrt(Math.max(0, value)) - sqrtD0) / span) * (r1 - r0)
  }
}
