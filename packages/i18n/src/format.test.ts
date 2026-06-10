import { describe, expect, it } from 'vitest'
import { formatDate, formatList, formatNumber, formatRelativeTime } from './format'
import { createLocale } from './locale'

describe('Intl formatting helpers', () => {
  it('formats per active locale', async () => {
    const store = createLocale({ default: 'en', supported: ['en', 'de'] })
    expect(formatNumber(1234.5)).toBe('1,234.5')
    await store.set('de')
    expect(formatNumber(1234.5)).toBe('1.234,5')
    expect(formatList(['a', 'b'])).toBe('a und b')
    await store.set('en')
  })

  it('formats dates and relative time', () => {
    createLocale({ default: 'en', supported: ['en'] })
    expect(formatDate(new Date(Date.UTC(2026, 5, 10)), { timeZone: 'UTC' })).toBe('6/10/2026')
    expect(formatRelativeTime(-1, 'day')).toBe('1 day ago')
  })
})
