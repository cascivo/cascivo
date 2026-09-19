/**
 * Date arithmetic for the month grid, kept pure so the awkward parts — month boundaries,
 * locale week starts, min/max clamping, skipping disabled days — are unit-testable without a
 * DOM.
 *
 * Everything is UTC. A `Date` built from local parts and compared through `getUTC*` getters
 * disagrees with itself by a day wherever the local offset crosses midnight, which is how
 * `aria-current="date"` landed on the wrong cell east of UTC+12.
 */

/** Midnight UTC on the same calendar day as `date`, whatever its time component. */
export function toUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Today as a UTC day, read from the *local* calendar.
 *
 * `new Date()` is an instant; its `getUTCDate()` is yesterday's number for anyone east of
 * UTC whose local clock has passed midnight but whose UTC clock has not. The user's "today"
 * is the one on their wall, so the local parts are what seed the UTC day.
 */
export function localToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

/** First day of the week for `locale`, 0 = Sunday. Falls back to Monday. */
export function getWeekStart(locale: string): number {
  try {
    const info = (new Intl.Locale(locale) as Intl.Locale & { weekInfo?: { firstDay: number } })
      .weekInfo
    if (info) return info.firstDay % 7
  } catch {
    // Intl.Locale or weekInfo unavailable; fall through.
  }
  return 1
}

/** The weeks of `month` in `year`, padded with nulls to whole rows. */
export function getMonthGrid(year: number, month: number, weekStart: number): (Date | null)[][] {
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  const offset = (first.getUTCDay() - weekStart + 7) % 7
  const days: (Date | null)[] = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= last.getUTCDate(); d++) days.push(new Date(Date.UTC(year, month, d)))
  while (days.length % 7 !== 0) days.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}

/** UTC day-key, used for equality and for addressing a rendered cell. */
export function dayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
}

export function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false
  return dayKey(a) === dayKey(b)
}

export function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days))
}

/**
 * `months` from `date`, clamped to the target month's length so 31 Jan + 1 is 28/29 Feb
 * rather than rolling into March.
 */
export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const lastOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastOfTarget)))
}

export function startOfWeek(date: Date, weekStart: number): Date {
  const diff = (date.getUTCDay() - weekStart + 7) % 7
  return addDays(date, -diff)
}

/** True when `date` falls outside the inclusive [min, max] bounds, compared by day. */
export function outOfRange(date: Date, min?: Date, max?: Date): boolean {
  const day = toUtcDay(date).getTime()
  if (min && day < toUtcDay(min).getTime()) return true
  if (max && day > toUtcDay(max).getTime()) return true
  return false
}

/**
 * ISO-8601 week number. Weeks start Monday and week 1 is the one containing the first
 * Thursday, which is why the Thursday of `date`'s week is what the year is taken from.
 */
export function isoWeek(date: Date): number {
  const thursday = addDays(toUtcDay(date), 3 - ((date.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const diff = thursday.getTime() - startOfWeek(firstThursday, 1).getTime()
  return 1 + Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
}

export interface NavBounds {
  min?: Date | undefined
  max?: Date | undefined
  isDisabled?: ((date: Date) => boolean) | undefined
}

/**
 * Where the keyboard should land moving `delta` days from `from`.
 *
 * Movement is clamped to [min, max] and skips days the caller reports disabled, continuing in
 * the direction of travel. Unbounded movement let a user arrow into 2085 where every day was
 * `aria-disabled`, and let the active cell rest on a day Enter would silently ignore. Returns
 * `null` when no reachable day exists in that direction.
 */
export function moveByDays(from: Date, delta: number, bounds: NavBounds): Date | null {
  const step = delta > 0 ? 1 : -1
  let candidate = addDays(from, delta)
  // Bounded search: at most a year of skipping before giving up, which is far more than any
  // real disabled run and keeps a pathological predicate from spinning.
  for (let i = 0; i < 366; i++) {
    if (outOfRange(candidate, bounds.min, bounds.max)) return null
    if (!bounds.isDisabled?.(candidate)) return candidate
    candidate = addDays(candidate, step)
  }
  return null
}

/** Same contract as `moveByDays`, stepping whole months. */
export function moveByMonths(from: Date, delta: number, bounds: NavBounds): Date | null {
  const target = addMonths(from, delta)
  if (outOfRange(target, bounds.min, bounds.max)) {
    // Land on the nearest in-range day rather than refusing to move at all — but only when
    // that edge lies in the direction of travel. Clamping a backward step onto a `min` that
    // is already ahead of the cursor would move the user forwards, which is not what they
    // asked for.
    const edge = delta > 0 ? bounds.max : bounds.min
    if (!edge) return null
    const day = toUtcDay(edge)
    const start = toUtcDay(from).getTime()
    if (delta > 0 ? day.getTime() <= start : day.getTime() >= start) return null
    return bounds.isDisabled?.(day) ? moveByDays(day, delta > 0 ? -1 : 1, bounds) : day
  }
  if (!bounds.isDisabled?.(target)) return target
  return moveByDays(target, delta > 0 ? 1 : -1, bounds)
}

/** True when stepping the *view* by `delta` months would leave the allowed range entirely. */
export function viewStepBlocked(
  year: number,
  month: number,
  delta: number,
  min?: Date,
  max?: Date,
): boolean {
  const target = new Date(Date.UTC(year, month + delta, 1))
  if (delta < 0 && min) {
    const lastOfTarget = new Date(Date.UTC(year, month + delta + 1, 0))
    return lastOfTarget.getTime() < toUtcDay(min).getTime()
  }
  if (delta > 0 && max) {
    return target.getTime() > toUtcDay(max).getTime()
  }
  return false
}
