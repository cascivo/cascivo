import { describe, expect, it } from 'vitest'
import {
  displayColumns,
  MIN_COLUMN_WIDTH,
  moveColumn,
  orderedColumns,
  pinColumn,
  resizeColumn,
  stickyOffsets,
  toggleColumnHidden,
} from './column-layout'

const cols = ['a', 'b', 'c', 'd', 'e'].map((key) => ({ key }))
const keys = (list: { key: string }[]) => list.map((c) => c.key)

describe('orderedColumns / displayColumns', () => {
  it('follows `order` and appends unlisted columns in definition order', () => {
    expect(keys(orderedColumns(cols, { order: ['d', 'b'] }))).toEqual(['d', 'b', 'a', 'c', 'e'])
    expect(keys(orderedColumns(cols, { order: ['zzz', 'c'] }))).toEqual(['c', 'a', 'b', 'd', 'e'])
    expect(keys(orderedColumns(cols, {}))).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('groups pinned-start first and pinned-end last, and drops hidden columns', () => {
    const state = { hidden: ['c'], pinned: { e: 'start' as const, a: 'end' as const } }
    expect(keys(displayColumns(cols, state))).toEqual(['e', 'b', 'd', 'a'])
  })

  it('never hides every column', () => {
    expect(keys(displayColumns(cols, { hidden: ['a', 'b', 'c', 'd', 'e'] }))).toEqual(keys(cols))
  })
})

describe('moveColumn', () => {
  it('swaps with the visible neighbour and returns a complete order', () => {
    expect(moveColumn(cols, {}, 'c', -1).order).toEqual(['a', 'c', 'b', 'd', 'e'])
    expect(moveColumn(cols, {}, 'c', 1).order).toEqual(['a', 'b', 'd', 'c', 'e'])
  })
  it('skips over hidden columns', () => {
    expect(moveColumn(cols, { hidden: ['b'] }, 'c', -1).order).toEqual(['c', 'a', 'b', 'd', 'e'])
  })
  it('does not cross pin groups or move past the edge', () => {
    const state = { pinned: { a: 'start' as const } }
    expect(moveColumn(cols, state, 'b', -1)).toBe(state) // a is pinned; b cannot pass it
    expect(moveColumn(cols, {}, 'a', -1).order).toBeUndefined()
    expect(moveColumn(cols, {}, 'e', 1).order).toBeUndefined()
    expect(moveColumn(cols, {}, 'nope', 1)).toEqual({})
  })
})

describe('pinColumn / resizeColumn / toggleColumnHidden', () => {
  it('pins, re-pins and unpins without touching other keys', () => {
    let s = pinColumn({}, 'a', 'start')
    s = pinColumn(s, 'b', 'end')
    expect(s.pinned).toEqual({ a: 'start', b: 'end' })
    s = pinColumn(s, 'a', null)
    expect(s.pinned).toEqual({ b: 'end' })
  })
  it('clamps widths to the minimum and clears with undefined', () => {
    let s = resizeColumn({}, 'a', 10)
    expect(s.widths).toEqual({ a: MIN_COLUMN_WIDTH })
    s = resizeColumn(s, 'a', 123.6)
    expect(s.widths).toEqual({ a: 124 })
    s = resizeColumn(s, 'a', undefined)
    expect(s.widths).toEqual({})
  })
  it('refuses to hide the last visible column', () => {
    let s = toggleColumnHidden(cols, {}, 'a')
    expect(s.hidden).toEqual(['a'])
    s = toggleColumnHidden(cols, { hidden: ['a', 'b', 'c', 'd'] }, 'e')
    expect(s.hidden).toEqual(['a', 'b', 'c', 'd'])
    s = toggleColumnHidden(cols, s, 'a')
    expect(s.hidden).toEqual(['b', 'c', 'd'])
  })
})

describe('stickyOffsets', () => {
  it('accumulates from the start for start-pinned and from the end for end-pinned', () => {
    const widths = [40, 100, 200, 150, 60]
    const sides = ['start', 'start', undefined, 'end', 'end'] as const
    expect(stickyOffsets(widths, sides)).toEqual([0, 40, undefined, 60, 0])
  })
})
