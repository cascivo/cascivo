import { signal } from '@cascivo/core'
import type { Interval } from '../data/instruments'

export type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | 'Max'

export const chartInterval = signal<Interval>('D')
export const chartRange = signal<Range>('3M')

/** Most-recent bar count shown for a given range (bounded for crisp SVG). */
export const RANGE_BARS: Record<Range, number> = {
  '1D': 32,
  '1W': 60,
  '1M': 90,
  '3M': 130,
  '1Y': 220,
  Max: Number.POSITIVE_INFINITY,
}

/** Range window for the summary sparkline. */
export const summaryRange = signal<Range>('1M')

/** Order ticket bottom-sheet (mobile) open state. */
export const ticketSheetOpen = signal(false)

/** Profile HeaderPanel open state. */
export const profileOpen = signal(false)

/** Which profile submenu is showing (null = the main menu). */
export const profileView = signal<string | null>(null)
