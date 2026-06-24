import { describe, expect, it } from 'vitest'
import { toStackedSeries, type StackedRow } from './stacked'

const rows: StackedRow[] = [
  {
    label: 'Mon',
    segments: [
      { key: 'Done', value: 5, color: 'var(--cascivo-color-success)' },
      { key: 'Blocked', value: 2, color: 'var(--cascivo-color-destructive)' },
    ],
  },
  {
    label: 'Tue',
    segments: [
      { key: 'Done', value: 8 },
      { key: 'In progress', value: 3, color: 'var(--cascivo-color-warning)' },
    ],
  },
]

describe('toStackedSeries', () => {
  it('produces one series per segment key in first-seen order', () => {
    const { series } = toStackedSeries(rows)
    expect(series.map((s) => s.id)).toEqual(['Done', 'Blocked', 'In progress'])
  })

  it('fills missing segments with 0 so stacks align', () => {
    const { series, y } = toStackedSeries(rows)
    const blocked = series.find((s) => s.id === 'Blocked')!
    // "Blocked" is absent on Tue → 0.
    expect(blocked.data.map(y)).toEqual([2, 0])
    const wip = series.find((s) => s.id === 'In progress')!
    // "In progress" is absent on Mon → 0.
    expect(wip.data.map(y)).toEqual([0, 3])
  })

  it('preserves the first non-undefined color per key', () => {
    const { series } = toStackedSeries(rows)
    expect(series.find((s) => s.id === 'Done')?.color).toBe('var(--cascivo-color-success)')
    expect(series.find((s) => s.id === 'In progress')?.color).toBe('var(--cascivo-color-warning)')
  })

  it('back-fills a color first seen on a later row', () => {
    const ragged: StackedRow[] = [
      { label: 'A', segments: [{ key: 'k', value: 1 }] },
      { label: 'B', segments: [{ key: 'k', value: 2, color: 'rebeccapurple' }] },
    ]
    expect(toStackedSeries(ragged).series[0]?.color).toBe('rebeccapurple')
  })

  it('returns identity x/y accessors and aligned category labels', () => {
    const { series, x } = toStackedSeries(rows)
    expect(series[0]?.data.map(x)).toEqual(['Mon', 'Tue'])
  })

  it('keeps per-category totals equal to the sum of segment values', () => {
    const { series, y } = toStackedSeries(rows)
    const totalAt = (i: number) => series.reduce((sum, s) => sum + y(s.data[i]!), 0)
    expect(totalAt(0)).toBe(5 + 2) // Mon: Done 5 + Blocked 2
    expect(totalAt(1)).toBe(8 + 3) // Tue: Done 8 + In progress 3
  })

  it('handles empty input', () => {
    expect(toStackedSeries([])).toEqual({
      series: [],
      x: expect.any(Function),
      y: expect.any(Function),
    })
  })
})
