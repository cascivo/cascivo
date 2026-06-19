import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate, formatList, formatNumber, formatRelativeTime } from './format'
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

  it('formats byte counts with the largest fitting unit', () => {
    createLocale({ default: 'en', supported: ['en'] })
    expect(formatBytes(0)).toMatch(/^0\s*byte/)
    expect(formatBytes(512)).toMatch(/^512\s*byte/)
    expect(formatBytes(1500)).toMatch(/^1\.5\s*kB/)
    expect(formatBytes(1_500_000)).toMatch(/^1\.5\s*MB/)
    // Binary scales by 1024 but keeps SI labels.
    expect(formatBytes(1536, { binary: true })).toMatch(/^1\.5\s*kB/)
  })
})
