import { describe, expect, it } from 'vitest'
import { aggregate, groupItems, headerSpans } from './row-group'

const rows = [
  { id: 'a', region: 'EU', status: 'open', amount: 10 },
  { id: 'b', region: 'US', status: 'open', amount: 20 },
  { id: 'c', region: 'EU', status: 'closed', amount: 5 },
  { id: 'd', region: 'EU', status: 'open', amount: 7 },
]
type R = (typeof rows)[number]
const valueOf = (row: R, key: string) => row[key as keyof R]
const shape = (items: ReturnType<typeof groupItems<R>>) =>
  items.map((item) =>
    'group' in item
      ? `${'  '.repeat(item.group.depth)}${item.group.column}=${String(item.group.value)} (${item.group.count})`
      : `    ${item.id}`,
  )

describe('groupItems', () => {
  it('interleaves group rows in order of first appearance and keeps row order within', () => {
    expect(shape(groupItems(rows, ['region'], valueOf, new Set()))).toEqual([
      'region=EU (3)',
      '    a',
      '    c',
      '    d',
      'region=US (1)',
      '    b',
    ])
  })

  it('nests levels and omits the leaves of a collapsed group but not the group row', () => {
    const items = groupItems(rows, ['region', 'status'], valueOf, new Set())
    expect(shape(items)).toEqual([
      'region=EU (3)',
      '  status=open (2)',
      '    a',
      '    d',
      '  status=closed (1)',
      '    c',
      'region=US (1)',
      '  status=open (1)',
      '    b',
    ])
    const eu = items[0]
    if (!eu || !('group' in eu)) throw new Error('expected a group')
    const collapsed = groupItems(rows, ['region', 'status'], valueOf, new Set([eu.group.key]))
    expect(shape(collapsed)).toEqual([
      'region=EU (3)',
      'region=US (1)',
      '  status=open (1)',
      '    b',
    ])
    expect(collapsed[0]).toMatchObject({
      group: { collapsed: true },
      leaves: [rows[0], rows[2], rows[3]],
    })
  })

  it('returns the rows untouched with no keys', () => {
    expect(groupItems(rows, [], valueOf, new Set())).toEqual(rows)
  })
})

describe('aggregate', () => {
  const values = [10, '20', null, undefined, '', 'n/a', 5]
  it('computes each kind over the numeric values only', () => {
    expect(aggregate(values, 'sum')).toBe(35)
    expect(aggregate(values, 'avg')).toBeCloseTo(35 / 3)
    expect(aggregate(values, 'min')).toBe(5)
    expect(aggregate(values, 'max')).toBe(20)
  })
  it('counts rows, and is undefined when nothing is numeric', () => {
    expect(aggregate(values, 'count')).toBe(7)
    expect(aggregate(['x', null], 'sum')).toBeUndefined()
    expect(aggregate([], 'count')).toBe(0)
  })
})

describe('headerSpans', () => {
  const groups = [
    { header: 'Who', columns: ['name', 'email'] },
    { header: 'Money', columns: ['amount', 'tax'] },
  ]
  it('merges adjacent columns of one group and leaves the rest unlabelled', () => {
    expect(headerSpans(['id', 'name', 'email', 'amount', 'tax', 'note'], groups)).toEqual([
      { header: undefined, span: 1 },
      { header: 'Who', span: 2 },
      { header: 'Money', span: 2 },
      { header: undefined, span: 1 },
    ])
  })
  it('splits a group whose columns were reordered apart', () => {
    expect(headerSpans(['name', 'amount', 'email'], groups)).toEqual([
      { header: 'Who', span: 1 },
      { header: 'Money', span: 1 },
      { header: 'Who', span: 1 },
    ])
  })
})
