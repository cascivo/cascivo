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
