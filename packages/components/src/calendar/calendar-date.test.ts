import { describe, expect, it, vi } from 'vitest'
import {
  addDays,
  addMonths,
  dayKey,
  getMonthGrid,
  getWeekStart,
  isoWeek,
  localToday,
  moveByDays,
  moveByMonths,
  outOfRange,
  sameDay,
  startOfWeek,
  toUtcDay,
  viewStepBlocked,
} from './calendar-date'

const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d))

describe('localToday', () => {
  it('reads the local calendar day, not the UTC instant', () => {
    // 1am on 15 March local, in a zone 13 hours ahead: the UTC clock still says the 14th.
    // The old build compared `new Date()` through getUTC* getters and marked the wrong cell.
    const now = new Date(2026, 2, 15, 1, 0, 0)
    expect(dayKey(localToday(now))).toBe('2026-2-15')
  })

  it('agrees with the wall clock at the end of the day too', () => {
    expect(dayKey(localToday(new Date(2026, 2, 15, 23, 30)))).toBe('2026-2-15')
  })
})

describe('toUtcDay', () => {
  it('drops the time component', () => {
    expect(toUtcDay(new Date(Date.UTC(2026, 0, 5, 18, 42))).toISOString()).toBe(
      '2026-01-05T00:00:00.000Z',
    )
  })
})

describe('getWeekStart', () => {
  it('never throws on an unusable locale', () => {
    // Intl does not reject every malformed tag, and where it supplies weekInfo the ISO
    // firstDay (1 = Monday … 7 = Sunday) maps through % 7 to a JS day index. Either way the
    // contract is a usable index, not a throw.
    expect(() => getWeekStart('not-a-locale')).not.toThrow()
    expect(getWeekStart('not-a-locale')).toBeGreaterThanOrEqual(0)
    expect(getWeekStart('not-a-locale')).toBeLessThanOrEqual(6)
  })

  it('returns a day index in range', () => {
    for (const locale of ['en-US', 'de-DE', 'en-GB']) {
      const start = getWeekStart(locale)
      expect(start, locale).toBeGreaterThanOrEqual(0)
      expect(start, locale).toBeLessThanOrEqual(6)
    }
  })
})

describe('getMonthGrid', () => {
  it('pads to whole weeks and covers every day', () => {
    const grid = getMonthGrid(2026, 1, 1) // February 2026
    expect(grid.every((week) => week.length === 7)).toBe(true)
    const days = grid.flat().filter(Boolean)
    expect(days).toHaveLength(28)
    expect(dayKey(days[0]!)).toBe('2026-1-1')
    expect(dayKey(days[27]!)).toBe('2026-1-28')
  })

  it('shifts the offset with the week start', () => {
    const monday = getMonthGrid(2026, 0, 1)
    const sunday = getMonthGrid(2026, 0, 0)
    const leadingNulls = (g: (Date | null)[][]): number => g.flat().findIndex((d) => d !== null)
    expect(leadingNulls(monday)).not.toBe(leadingNulls(sunday))
  })

  it('handles a leap February', () => {
    expect(getMonthGrid(2028, 1, 1).flat().filter(Boolean)).toHaveLength(29)
  })
})

describe('addDays / addMonths', () => {
  it('crosses a month boundary', () => {
    expect(dayKey(addDays(utc(2026, 0, 31), 1))).toBe('2026-1-1')
    expect(dayKey(addDays(utc(2026, 0, 1), -1))).toBe('2025-11-31')
  })

  it('clamps a month step to the target month length', () => {
    // 31 Jan + 1 month is 28 Feb, not 3 March.
    expect(dayKey(addMonths(utc(2026, 0, 31), 1))).toBe('2026-1-28')
    expect(dayKey(addMonths(utc(2028, 0, 31), 1))).toBe('2028-1-29')
  })

  it('crosses a year boundary', () => {
    expect(dayKey(addMonths(utc(2026, 11, 15), 1))).toBe('2027-0-15')
    expect(dayKey(addMonths(utc(2026, 0, 15), -1))).toBe('2025-11-15')
  })
})

describe('startOfWeek', () => {
  it('walks back to the configured first day', () => {
    // 2026-03-18 is a Wednesday.
    expect(dayKey(startOfWeek(utc(2026, 2, 18), 1))).toBe('2026-2-16')
    expect(dayKey(startOfWeek(utc(2026, 2, 18), 0))).toBe('2026-2-15')
  })
})

describe('outOfRange', () => {
  const min = utc(2026, 0, 10)
  const max = utc(2026, 0, 20)

  it('is inclusive at both ends', () => {
    expect(outOfRange(min, min, max)).toBe(false)
    expect(outOfRange(max, min, max)).toBe(false)
  })

  it('rejects outside', () => {
    expect(outOfRange(utc(2026, 0, 9), min, max)).toBe(true)
    expect(outOfRange(utc(2026, 0, 21), min, max)).toBe(true)
  })

  it('ignores the time component of the bounds', () => {
    expect(outOfRange(utc(2026, 0, 10), new Date(Date.UTC(2026, 0, 10, 23, 59)), max)).toBe(false)
  })

  it('accepts everything when unbounded', () => {
    expect(outOfRange(utc(1990, 5, 5))).toBe(false)
  })
})

describe('moveByDays', () => {
  it('moves in both directions', () => {
    expect(dayKey(moveByDays(utc(2026, 0, 15), 1, {})!)).toBe('2026-0-16')
    expect(dayKey(moveByDays(utc(2026, 0, 15), -7, {})!)).toBe('2026-0-8')
  })

  it('refuses to leave the allowed range', () => {
    // The old build was unbounded, so a user could arrow into a year where every day was
    // aria-disabled.
    expect(moveByDays(utc(2026, 0, 10), -1, { min: utc(2026, 0, 10) })).toBeNull()
    expect(moveByDays(utc(2026, 0, 20), 1, { max: utc(2026, 0, 20) })).toBeNull()
  })

  it('skips a disabled day and keeps going', () => {
    const isDisabled = (d: Date): boolean => [16, 17].includes(d.getUTCDate())
    expect(dayKey(moveByDays(utc(2026, 0, 15), 1, { isDisabled })!)).toBe('2026-0-18')
  })

  it('skips backwards too', () => {
    const isDisabled = (d: Date): boolean => d.getUTCDate() === 14
    expect(dayKey(moveByDays(utc(2026, 0, 15), -1, { isDisabled })!)).toBe('2026-0-13')
  })

  it('returns null when the skip runs out of range', () => {
    expect(
      moveByDays(utc(2026, 0, 15), 1, { max: utc(2026, 0, 17), isDisabled: () => true }),
    ).toBeNull()
  })

  it('gives up rather than spinning on a predicate that disables everything', () => {
    const isDisabled = vi.fn(() => true)
    expect(moveByDays(utc(2026, 0, 15), 1, { isDisabled })).toBeNull()
    expect(isDisabled.mock.calls.length).toBeLessThanOrEqual(366)
  })
})

describe('moveByMonths', () => {
  it('steps a month and clamps the day', () => {
    expect(dayKey(moveByMonths(utc(2026, 0, 31), 1, {})!)).toBe('2026-1-28')
  })

  it('lands on the nearest in-range day rather than refusing', () => {
    const max = utc(2026, 0, 20)
    expect(dayKey(moveByMonths(utc(2026, 0, 15), 1, { max })!)).toBe('2026-0-20')
  })

  it('skips a disabled landing day', () => {
    const isDisabled = (d: Date): boolean => d.getUTCMonth() === 1 && d.getUTCDate() === 15
    expect(dayKey(moveByMonths(utc(2026, 0, 15), 1, { isDisabled })!)).toBe('2026-1-16')
  })

  it('lands on the min bound when the month step would undershoot it', () => {
    expect(dayKey(moveByMonths(utc(2026, 0, 15), -1, { min: utc(2026, 0, 1) })!)).toBe('2026-0-1')
  })

  it('is null when the step leaves range and there is no bound in that direction', () => {
    // Stepping back past a max-only range has no edge to land on.
    expect(moveByMonths(utc(2026, 0, 15), -1, { min: utc(2026, 0, 20) })).toBeNull()
  })
})

describe('viewStepBlocked', () => {
  it('blocks paging before a month that is entirely below min', () => {
    expect(viewStepBlocked(2026, 1, -1, utc(2026, 1, 1))).toBe(true)
    expect(viewStepBlocked(2026, 1, -1, utc(2026, 0, 15))).toBe(false)
  })

  it('blocks paging past a max', () => {
    expect(viewStepBlocked(2026, 1, 1, undefined, utc(2026, 1, 20))).toBe(true)
    expect(viewStepBlocked(2026, 1, 1, undefined, utc(2026, 2, 10))).toBe(false)
  })

  it('never blocks when unbounded', () => {
    expect(viewStepBlocked(2026, 5, -1)).toBe(false)
    expect(viewStepBlocked(2026, 5, 1)).toBe(false)
  })
})

describe('sameDay', () => {
  it('ignores the time component and rejects nullish', () => {
    expect(sameDay(new Date(Date.UTC(2026, 0, 5, 3)), utc(2026, 0, 5))).toBe(true)
    expect(sameDay(null, utc(2026, 0, 5))).toBe(false)
    expect(sameDay(undefined, undefined)).toBe(false)
  })
})

describe('isoWeek', () => {
  it('numbers the first week of a year containing a Thursday', () => {
    expect(isoWeek(utc(2026, 0, 1))).toBe(1)
  })

  it('advances weekly', () => {
    expect(isoWeek(utc(2026, 0, 8))).toBe(2)
    expect(isoWeek(utc(2026, 5, 15))).toBe(25)
  })
})
