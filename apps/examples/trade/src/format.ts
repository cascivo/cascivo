import { formatDate, formatNumber } from '@cascivo/i18n'

/** A price or cash amount in euros. */
export function money(value: number): string {
  return formatNumber(value, { style: 'currency', currency: 'EUR' })
}

/** A bare price (no currency symbol) — for dense ladders/tapes. */
export function price(value: number): string {
  return formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** A share or contract count. */
export function qty(value: number): string {
  return formatNumber(value, { maximumFractionDigits: 0 })
}

/** A signed percentage, e.g. "+32.94%". */
export function signedPct(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

/** A signed absolute delta, e.g. "+0.53". */
export function signedNumber(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Absolute clock time (HH:mm:ss) — for the trade tape. */
export function clock(value: number): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

/** A calendar day, e.g. "3 Jul" — for order history. */
export function day(value: number): string {
  return formatDate(value, { day: 'numeric', month: 'short' })
}
