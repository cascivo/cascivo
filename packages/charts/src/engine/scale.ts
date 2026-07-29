export interface LinearScale {
  domain: [number, number]
  range: [number, number]
  map(value: number): number
  invert(position: number): number
  ticks(count?: number, allowDecimals?: boolean): number[]
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
    ticks: (count = 5, allowDecimals) => niceTicks(d0, d1, count, allowDecimals),
  }
}

/**
 * Extended nice-numbers: steps are 1, 2, 2.5 or 5 × 10^k covering [min, max].
 *
 * `count` is a **density hint**, not a tick count — the step is snapped to the nearest
 * nice number, so the result may have more or fewer ticks than asked for. That is standard
 * (d3 behaves the same) and is right for continuous data.
 *
 * It is wrong for a whole-number domain. `(max - min) / count` happily produces a
 * *fractional* step when the requested density is finer than the data's own unit:
 * `max=1, count=2` → rawStep 0.5 → `[0, 0.5, 1]`; `max=1, count=5` →
 * `[0, 0.2, 0.4, 0.6, 0.8, 1]`. An incident-count chart with 0–3 incidents per severity
 * hits this constantly, and the obvious workaround (`yTicks={max + 1}`) lands straight on
 * it at `max=1` (2026-07-28 report C17a).
 *
 * So when every bound is an integer, the step is floored at 1 and snapped to an integer
 * nice-number unless `allowDecimals` is explicitly `true`. Callers with genuinely
 * continuous integer-bounded data (a 0–1 ratio axis) opt back in.
 *
 * @param allowDecimals Force fractional steps on (`true`) or off (`false`). Omit to
 *   auto-detect: integer bounds get integer ticks, anything else keeps today's behavior.
 */
export function niceTicks(min: number, max: number, count = 5, allowDecimals?: boolean): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min]
  if (min > max) [min, max] = [max, min]
  // Auto-detect: a whole-number domain means whole-number ticks unless told otherwise.
  const decimalsAllowed = allowDecimals ?? !(Number.isInteger(min) && Number.isInteger(max))
  const rawStep = (max - min) / Math.max(1, count)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  // 2.5 is a fine step for continuous data and never an integer multiple below 10, so it
  // drops out of the candidate set when the domain is whole-number.
  const candidates = decimalsAllowed ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10]
  const mantissa = rawStep / magnitude
  let step = (candidates.find((c) => c >= mantissa) ?? 10) * magnitude
  // Never subdivide below the data's own unit: [0,1] asked for 5 ticks yields [0,1], not
  // [0, 0.2, 0.4, …]. Math.round clears float noise from the 10**log10 round-trip.
  if (!decimalsAllowed) step = Math.max(1, Math.round(step))
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
