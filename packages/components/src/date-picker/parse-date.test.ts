import { describe, expect, it } from 'vitest'
import { formatHint, fromISO, isDayFirst, parseTypedDate, toISO } from './parse-date'

const iso = (d: Date | null): string | null => (d ? toISO(d) : null)

describe('toISO / fromISO', () => {
  it('round-trips', () => {
    expect(toISO(new Date(Date.UTC(2026, 2, 18)))).toBe('2026-03-18')
    expect(iso(fromISO('2026-03-18'))).toBe('2026-03-18')
  })

  it('pads single-digit components', () => {
    expect(toISO(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05')
  })

  it('rejects a malformed or impossible ISO string', () => {
    expect(fromISO('2026-3-18')).toBeNull()
    expect(fromISO('not-a-date')).toBeNull()
    expect(fromISO('')).toBeNull()
    // 30 February would silently roll into March via Date.UTC.
    expect(fromISO('2026-02-30')).toBeNull()
    expect(fromISO('2026-13-01')).toBeNull()
  })

  it('accepts a real leap day and rejects a fake one', () => {
    expect(iso(fromISO('2028-02-29'))).toBe('2028-02-29')
    expect(fromISO('2026-02-29')).toBeNull()
  })
})

describe('isDayFirst', () => {
  it('recognises day-first and month-first locales', () => {
    expect(isDayFirst('en-GB')).toBe(true)
    expect(isDayFirst('de-DE')).toBe(true)
    expect(isDayFirst('en-US')).toBe(false)
  })

  it('does not throw on an unusable locale', () => {
    expect(() => isDayFirst('not-a-locale')).not.toThrow()
  })
})

describe('parseTypedDate', () => {
  it('accepts ISO from any locale', () => {
    expect(iso(parseTypedDate('2026-03-18', 'en-US'))).toBe('2026-03-18')
    expect(iso(parseTypedDate('2026-03-18', 'de-DE'))).toBe('2026-03-18')
  })

  it('reads the component order from the locale', () => {
    expect(iso(parseTypedDate('18/03/2026', 'en-GB'))).toBe('2026-03-18')
    expect(iso(parseTypedDate('03/18/2026', 'en-US'))).toBe('2026-03-18')
  })

  it('accepts the separators people actually type', () => {
    for (const text of ['18/03/2026', '18.03.2026', '18-03-2026', '18 03 2026']) {
      expect(iso(parseTypedDate(text, 'en-GB')), text).toBe('2026-03-18')
    }
  })

  it('windows a two-digit year to this century', () => {
    expect(iso(parseTypedDate('18/03/26', 'en-GB'))).toBe('2026-03-18')
  })

  it('fills the year from the reference when only two components are given', () => {
    expect(iso(parseTypedDate('18/03', 'en-GB', 2030))).toBe('2030-03-18')
  })

  it('rejects an impossible date rather than rolling it over', () => {
    expect(parseTypedDate('30/02/2026', 'en-GB')).toBeNull()
    expect(parseTypedDate('32/01/2026', 'en-GB')).toBeNull()
    expect(parseTypedDate('18/13/2026', 'en-GB')).toBeNull()
  })

  it('rejects text that is not a date', () => {
    expect(parseTypedDate('', 'en-GB')).toBeNull()
    expect(parseTypedDate('tomorrow', 'en-GB')).toBeNull()
    expect(parseTypedDate('18', 'en-GB')).toBeNull()
    expect(parseTypedDate('1/2/3/4', 'en-GB')).toBeNull()
    expect(parseTypedDate('18/ab/2026', 'en-GB')).toBeNull()
  })

  it('tolerates surrounding whitespace', () => {
    expect(iso(parseTypedDate('  18/03/2026  ', 'en-GB'))).toBe('2026-03-18')
  })
})

describe('formatHint', () => {
  it('shows the shape the locale expects', () => {
    expect(formatHint('en-GB')).toBe('DD/MM/YYYY')
    expect(formatHint('en-US')).toBe('MM/DD/YYYY')
  })

  it('produces a hint that parseTypedDate itself accepts', () => {
    // The placeholder must not promise a format the parser rejects.
    for (const locale of ['en-GB', 'en-US', 'de-DE']) {
      const sample = formatHint(locale)
        .replace('DD', '18')
        .replace('MM', '03')
        .replace('YYYY', '2026')
      expect(iso(parseTypedDate(sample, locale)), locale).toBe('2026-03-18')
    }
  })
})
