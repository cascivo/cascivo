/**
 * Parsing and formatting for the typed date field, kept pure so the ambiguous cases —
 * day-first versus month-first locales, two-digit years, out-of-range components — are
 * unit-testable without a DOM.
 *
 * The component previously had no text field at all: the trigger was a button, so a date
 * already known could only be reached by paging a grid. Its own manifest listed "a date
 * already known by typing" as a reason *not* to use it.
 */

/** ISO `YYYY-MM-DD` for a UTC date. */
export function toISO(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** UTC date from `YYYY-MM-DD`, or null when the string is not a real date. */
export function fromISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  return makeDate(Number(m[1]), Number(m[2]), Number(m[3]))
}

/** Build a UTC date, rejecting components that would roll over into another month. */
function makeDate(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  // `Date.UTC(2026, 1, 30)` silently becomes 2 March; reject rather than accept a date the
  // user did not type.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

/**
 * Whether `locale` writes the day before the month, decided by asking `Intl` to format a date
 * whose parts are unambiguous rather than by keeping a list of locales.
 */
export function isDayFirst(locale: string): boolean {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date(Date.UTC(2026, 0, 2)))
    const order = parts.filter((p) => p.type === 'day' || p.type === 'month').map((p) => p.type)
    return order[0] === 'day'
  } catch {
    return false
  }
}

/**
 * Parse what the user typed.
 *
 * ISO is accepted from every locale because it is unambiguous and is what the component
 * emits. Anything else is read as two or three numbers separated by `/`, `.`, `-` or a space,
 * ordered by the locale. A two-digit year is windowed to 2000–2099, which is the convention
 * every date field in a browser uses. Returns null when the text is not a date, so a
 * half-typed value is rejected rather than coerced.
 */
export function parseTypedDate(text: string, locale: string, referenceYear?: number): Date | null {
  const trimmed = text.trim()
  if (trimmed === '') return null

  const iso = fromISO(trimmed)
  if (iso) return iso

  const parts = trimmed.split(/[/.\-\s]+/).filter(Boolean)
  if (parts.length < 2 || parts.length > 3) return null
  if (!parts.every((p) => /^\d{1,4}$/.test(p))) return null

  const nums = parts.map(Number)
  const dayFirst = isDayFirst(locale)
  let day: number
  let month: number
  let year: number

  if (nums.length === 2) {
    ;[day, month] = dayFirst ? [nums[0]!, nums[1]!] : [nums[1]!, nums[0]!]
    year = referenceYear ?? new Date().getFullYear()
  } else {
    ;[day, month] = dayFirst ? [nums[0]!, nums[1]!] : [nums[1]!, nums[0]!]
    year = nums[2]!
    if (parts[2]!.length <= 2) year = 2000 + year
  }
  return makeDate(year, month, day)
}

/** The date as the locale writes it, for display in the field when it is not being edited. */
export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options ?? { timeZone: 'UTC' }).format(date)
}

/**
 * A placeholder showing the shape this locale expects, built from a date whose parts are
 * each distinguishable, so the hint matches what `parseTypedDate` will accept.
 */
export function formatHint(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: 'UTC' })
      .formatToParts(new Date(Date.UTC(2026, 10, 22)))
      .map((part) => {
        if (part.type === 'day') return 'DD'
        if (part.type === 'month') return 'MM'
        if (part.type === 'year') return 'YYYY'
        return part.value
      })
      .join('')
  } catch {
    return 'YYYY-MM-DD'
  }
}
