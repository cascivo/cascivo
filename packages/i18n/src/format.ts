import { currentLocale } from './locale'

function memo<O, F>(create: (locale: string, options?: O) => F): (options?: O) => F {
  const cache = new Map<string, F>()
  return (options?: O) => {
    const locale = currentLocale()
    const key = `${locale}|${JSON.stringify(options ?? {})}`
    let formatter = cache.get(key)
    if (!formatter) {
      formatter = create(locale, options)
      cache.set(key, formatter)
    }
    return formatter
  }
}

const numberFormat = memo(
  (locale, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, options),
)
const dateFormat = memo(
  (locale, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options),
)
const relativeFormat = memo(
  (locale, options?: Intl.RelativeTimeFormatOptions) =>
    new Intl.RelativeTimeFormat(locale, options),
)
const listFormat = memo(
  (locale, options?: Intl.ListFormatOptions) => new Intl.ListFormat(locale, options),
)

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return numberFormat(options).format(value)
}

export function formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
  return dateFormat(options).format(value)
}

export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  return relativeFormat(options).format(value, unit)
}

export function formatList(items: string[], options?: Intl.ListFormatOptions): string {
  return listFormat(options).format(items)
}

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'] as const

export interface FormatBytesOptions extends Intl.NumberFormatOptions {
  /** Scale by 1024 instead of 1000. The SI unit labels are kept. Default false. */
  binary?: boolean
}

/**
 * Formats a byte count as a localized, human-readable string (e.g. `1.5 kB`),
 * choosing the largest unit that keeps the value ≥ 1. Locale-aware via the
 * active `@cascivo/i18n` store.
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  const { binary = false, ...numberOptions } = options
  const base = binary ? 1024 : 1000
  const negative = bytes < 0
  let value = Math.abs(bytes)
  let unitIndex = 0
  while (value >= base && unitIndex < BYTE_UNITS.length - 1) {
    value /= base
    unitIndex++
  }
  return formatNumber(negative ? -value : value, {
    style: 'unit',
    unit: BYTE_UNITS[unitIndex],
    unitDisplay: 'short',
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
    ...numberOptions,
  })
}
