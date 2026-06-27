import { describe, expect, it } from 'vitest'
import { encode, encodeCategory } from './dataset'

const rows = [
  { date: 1, value: 10, team: 'a' },
  { date: 2, value: 20, team: 'a' },
  { date: 1, value: 5, team: 'b' },
  { date: 2, value: 8, team: 'b' },
]

describe('encode', () => {
  it('encodes a flat table into a single series', () => {
    const out = encode(rows, { x: 'date', y: 'value' })
    expect(out.series).toHaveLength(1)
    expect(out.series[0]!.data).toEqual([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 1, y: 5 },
      { x: 2, y: 8 },
    ])
    expect(out.x(out.series[0]!.data[0]!)).toBe(1)
    expect(out.y(out.series[0]!.data[0]!)).toBe(10)
  })

  it('splits into multiple series by a series key (first-seen order)', () => {
    const out = encode(rows, { x: 'date', y: 'value', series: 'team' })
    expect(out.series.map((s) => s.id)).toEqual(['a', 'b'])
    expect(out.series[0]!.data).toEqual([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ])
  })

  it('handles missing fields gracefully', () => {
    const out = encode([{ date: 1 }], { x: 'date', y: 'value' })
    expect(out.series[0]!.data[0]!.x).toBe(1)
    expect(Number.isNaN(out.series[0]!.data[0]!.y)).toBe(true)
  })
})

describe('encodeCategory', () => {
  it('maps a table to {label,value}[]', () => {
    const out = encodeCategory(
      [
        { name: 'x', n: 3 },
        { name: 'y', n: 7 },
      ],
      { category: 'name', value: 'n' },
    )
    expect(out).toEqual([
      { label: 'x', value: 3 },
      { label: 'y', value: 7 },
    ])
  })
})
