export interface TimeScale {
  domain: [Date, Date]
  range: [number, number]
  map(value: Date): number
  invert(position: number): Date
  ticks(count?: number): Date[]
  /**
   * The unit the ticks step in at the given density. Pass the same `count` you pass to
   * {@link TimeScale.ticks} — a 24-hour domain steps in hours at `count: 6` and in days at
   * `count: 1`, so a hardcoded density would disagree with the ticks actually drawn.
   */
  tickInterval(count?: number): IntervalUnit
  /**
   * `Intl.DateTimeFormat` options that make the ticks at this density distinguishable.
   * Sub-day steps format as times, day/week steps as dates, and so on — formatting a
   * 3-hourly axis with a day format renders the same string on every tick.
   */
  tickFormat(count?: number): Intl.DateTimeFormatOptions
}

export type IntervalUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

const MS: Record<IntervalUnit, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_629_800_000,
  quarter: 7_889_400_000,
  year: 31_557_600_000,
}

/**
 * Candidate tick steps, coarsest-last.
 *
 * The steps are the reason this table exists. With one entry per unit, choosing a step meant
 * choosing between "every hour" (23 ticks across a day) and "every day" (1) with nothing in
 * between, so a sub-day domain always collapsed to a single tick and `count` was ignored —
 * the 2026-08-08 report B defect. `hour × 3` is the tick a 24-hour dashboard chart wants and
 * was previously unreachable.
 */
const STEPS: Array<{ unit: IntervalUnit; step: number }> = [
  { unit: 'minute', step: 1 },
  { unit: 'minute', step: 5 },
  { unit: 'minute', step: 15 },
  { unit: 'minute', step: 30 },
  { unit: 'hour', step: 1 },
  { unit: 'hour', step: 2 },
  { unit: 'hour', step: 3 },
  { unit: 'hour', step: 6 },
  { unit: 'hour', step: 12 },
  { unit: 'day', step: 1 },
  { unit: 'day', step: 2 },
  { unit: 'week', step: 1 },
  { unit: 'month', step: 1 },
  { unit: 'month', step: 3 },
  { unit: 'year', step: 1 },
  { unit: 'year', step: 2 },
  { unit: 'year', step: 5 },
  { unit: 'year', step: 10 },
]

/** Snap down to a round boundary of `step` × `unit`. */
function floorToInterval(date: Date, unit: IntervalUnit, step: number): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  if (unit === 'year') return new Date(Date.UTC(Math.floor(y / step) * step, 0, 1))
  if (unit === 'quarter') return new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1))
  if (unit === 'month') return new Date(Date.UTC(y, Math.floor(m / step) * step, 1))
  if (unit === 'week') return new Date(Date.UTC(y, m, d - date.getUTCDay()))
  if (unit === 'day') return new Date(Date.UTC(y, m, d))
  if (unit === 'hour')
    return new Date(Date.UTC(y, m, d, Math.floor(date.getUTCHours() / step) * step))
  return new Date(
    Date.UTC(y, m, d, date.getUTCHours(), Math.floor(date.getUTCMinutes() / step) * step),
  )
}

function addInterval(date: Date, unit: IntervalUnit, n: number): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  if (unit === 'year') return new Date(Date.UTC(y + n, m, 1))
  if (unit === 'quarter') return new Date(Date.UTC(y, m + 3 * n, 1))
  if (unit === 'month') return new Date(Date.UTC(y, m + n, 1))
  return new Date(date.getTime() + MS[unit] * n)
}

/**
 * Format options that keep ticks at this step distinguishable.
 *
 * Keyed on the STEP, not just the unit: an `hour`-stepped axis crossing midnight still needs
 * only the hour (the date belongs on the axis title), while a `day` step needs the date.
 */
function formatForStep(unit: IntervalUnit): Intl.DateTimeFormatOptions {
  if (unit === 'minute') return { hour: 'numeric', minute: '2-digit' }
  if (unit === 'hour') return { hour: 'numeric' }
  if (unit === 'day' || unit === 'week') return { month: 'short', day: 'numeric' }
  if (unit === 'month' || unit === 'quarter') return { month: 'short', year: 'numeric' }
  return { year: 'numeric' }
}

export function timeScale(domain: [Date, Date], range: [number, number]): TimeScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1.getTime() - d0.getTime()

  /**
   * The (unit, step) whose tick count lands closest to `count`.
   *
   * Closest, not first-that-fits: first-that-fits is what made a 23-hour domain pick `day`
   * (≈1 tick) over `hour` (23) when asked for 5 — it accepted a massive undershoot because
   * it only ever tested the upper bound.
   */
  function pickStep(count: number): { unit: IntervalUnit; step: number } {
    const target = Math.max(2, count)
    let best = STEPS[STEPS.length - 1]!
    let bestErr = Infinity
    for (const candidate of STEPS) {
      const produced = span / (MS[candidate.unit] * candidate.step)
      if (produced < 1.5) continue // coarser than the domain — would render 0–1 ticks
      // Compare in log space so half as many and twice as many score alike.
      const err = Math.abs(Math.log(produced / target))
      if (err < bestErr) {
        bestErr = err
        best = candidate
      }
    }
    return best
  }

  return {
    domain,
    range,
    map: (value) => (span === 0 ? r0 : r0 + ((value.getTime() - d0.getTime()) / span) * (r1 - r0)),
    invert: (position) => new Date(d0.getTime() + ((position - r0) / (r1 - r0)) * span),
    tickInterval: (count = 5) => pickStep(count).unit,
    tickFormat: (count = 5) => formatForStep(pickStep(count).unit),
    ticks: (count = 5) => {
      const { unit, step } = pickStep(count)
      const start = floorToInterval(d0, unit, step)
      const ticks: Date[] = []
      let current = start.getTime() >= d0.getTime() ? start : addInterval(start, unit, step)
      let safety = 0
      while (current.getTime() <= d1.getTime() && safety++ < 500) {
        ticks.push(current)
        current = addInterval(current, unit, step)
      }
      return ticks
    },
  }
}
