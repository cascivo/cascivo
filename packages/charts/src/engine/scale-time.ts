export interface TimeScale {
  domain: [Date, Date]
  range: [number, number]
  map(value: Date): number
  invert(position: number): Date
  ticks(count?: number): Date[]
  tickInterval(): 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  tickFormat(): Intl.DateTimeFormatOptions
}

type IntervalUnit = TimeScale['tickInterval'] extends () => infer T ? T : never

const INTERVALS: Array<{ unit: IntervalUnit; ms: number }> = [
  { unit: 'minute', ms: 60_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'day', ms: 86_400_000 },
  { unit: 'week', ms: 604_800_000 },
  { unit: 'month', ms: 2_629_800_000 },
  { unit: 'quarter', ms: 7_889_400_000 },
  { unit: 'year', ms: 31_557_600_000 },
]

function floorToInterval(date: Date, unit: IntervalUnit): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  if (unit === 'year') return new Date(Date.UTC(y, 0, 1))
  if (unit === 'quarter') return new Date(Date.UTC(y, Math.floor(m / 3) * 3, 1))
  if (unit === 'month') return new Date(Date.UTC(y, m, 1))
  if (unit === 'week') {
    const d = date.getUTCDate() - date.getUTCDay()
    return new Date(Date.UTC(y, m, d))
  }
  if (unit === 'day') return new Date(Date.UTC(y, m, date.getUTCDate()))
  if (unit === 'hour') return new Date(Date.UTC(y, m, date.getUTCDate(), date.getUTCHours()))
  return new Date(Date.UTC(y, m, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes()))
}

function addInterval(date: Date, unit: IntervalUnit, n = 1): Date {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  if (unit === 'year') return new Date(Date.UTC(y + n, m, 1))
  if (unit === 'quarter') return new Date(Date.UTC(y, m + 3 * n, 1))
  if (unit === 'month') return new Date(Date.UTC(y, m + n, 1))
  const ms = { week: 604_800_000, day: 86_400_000, hour: 3_600_000, minute: 60_000 }[unit]!
  return new Date(date.getTime() + ms * n)
}

export function timeScale(domain: [Date, Date], range: [number, number]): TimeScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1.getTime() - d0.getTime()

  function pickInterval(count: number): IntervalUnit {
    for (const interval of INTERVALS) {
      if (span / interval.ms <= count * 1.5) return interval.unit
    }
    return 'year'
  }

  function formatForInterval(unit: IntervalUnit): Intl.DateTimeFormatOptions {
    if (unit === 'minute') return { hour: 'numeric', minute: '2-digit' }
    if (unit === 'hour') return { hour: 'numeric' }
    if (unit === 'day') return { month: 'short', day: 'numeric' }
    if (unit === 'week') return { month: 'short', day: 'numeric' }
    if (unit === 'month') return { month: 'short', year: 'numeric' }
    if (unit === 'quarter') return { month: 'short', year: 'numeric' }
    return { year: 'numeric' }
  }

  return {
    domain,
    range,
    map: (value) => (span === 0 ? r0 : r0 + ((value.getTime() - d0.getTime()) / span) * (r1 - r0)),
    invert: (position) => new Date(d0.getTime() + ((position - r0) / (r1 - r0)) * span),
    tickInterval: () => pickInterval(5),
    tickFormat: () => formatForInterval(pickInterval(5)),
    ticks: (count = 5) => {
      const unit = pickInterval(count)
      const start = floorToInterval(d0, unit)
      const ticks: Date[] = []
      let current = start.getTime() >= d0.getTime() ? start : addInterval(start, unit)
      let safety = 0
      while (current.getTime() <= d1.getTime() && safety++ < 100) {
        ticks.push(current)
        current = addInterval(current, unit)
      }
      return ticks
    },
  }
}
