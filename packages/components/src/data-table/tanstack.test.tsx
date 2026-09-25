import { cleanup, render, screen } from '@testing-library/react'
import type { ColumnDef, SortingState } from '@tanstack/table-core'
import { afterEach, describe, expect, it } from 'vitest'
import { DataTable } from './data-table'
import { fromTanStack, toSortState, toTanStackSorting } from './tanstack'

interface Person {
  id: string
  first: string
  last: string
  age: number
  address: { city: string }
}

const people: Person[] = [
  { id: 'a', first: 'Ada', last: 'Lovelace', age: 36, address: { city: 'London' } },
  { id: 'b', first: 'Grace', last: 'Hopper', age: 85, address: { city: 'Arlington' } },
]

// Typed as TanStack's own ColumnDef: the adapter must accept it without a cast.
const defs: ColumnDef<Person>[] = [
  { accessorKey: 'first', header: 'First name' },
  {
    id: 'full',
    header: 'Full name',
    accessorFn: (p) => `${p.first} ${p.last}`,
    cell: (info) => <strong>{String(info.getValue())}</strong>,
  },
  { accessorKey: 'address.city', header: 'City' },
  {
    header: 'Details',
    columns: [{ accessorKey: 'age', header: 'Age', size: 80, enableSorting: false }],
  },
  { id: 'actions', header: () => 'ignored', cell: ({ row }) => `edit ${row.original.id}` },
]

afterEach(cleanup)

describe('fromTanStack', () => {
  it('maps column definitions onto DataTable columns', () => {
    const { columns } = fromTanStack(defs, people)
    expect(columns.map((c) => [c.key, c.header, c.sortable])).toEqual([
      ['first', 'First name', true],
      ['full', 'Full name', true],
      ['address.city', 'City', true],
      ['age', 'Age', false],
      ['actions', 'actions', false],
    ])
    expect(columns[3]!.width).toBe('80px')
  })

  it('returns the rows as given when every column reads a plain property', () => {
    const { rows } = fromTanStack([{ accessorKey: 'first', header: 'First' }], people)
    expect(rows[0]).toBe(people[0])
  })

  it('precomputes accessorFn and dotted-key values so the table can sort and search them', () => {
    const { rows } = fromTanStack(defs, people)
    expect(rows[1]).toMatchObject({ full: 'Grace Hopper', 'address.city': 'Arlington', age: 85 })
  })

  it('renders cells through the TanStack cell functions', () => {
    const { columns, rows } = fromTanStack(defs, people)
    render(<DataTable columns={columns} rows={rows} getRowId={(p) => p.id} />)
    expect(screen.getByText('Ada Lovelace').tagName).toBe('STRONG')
    expect(screen.getByText('edit b')).toBeTruthy()
    expect(screen.getByText('Arlington')).toBeTruthy()
  })

  it('rejects a column it cannot key', () => {
    expect(() => fromTanStack([{ cell: () => 'x' }], people)).toThrow(/give it an `id`/)
  })
})

describe('sorting state', () => {
  it('round-trips a multi-column TanStack SortingState', () => {
    const sorting: SortingState = [
      { id: 'last', desc: true },
      { id: 'age', desc: false },
    ]
    const state = toSortState(sorting)
    expect(state).toEqual({
      key: 'last',
      direction: 'desc',
      thenBy: [{ key: 'age', direction: 'asc' }],
    })
    expect(toTanStackSorting(state)).toEqual(sorting)
    expect(toSortState([])).toBeUndefined()
    expect(toTanStackSorting(undefined)).toEqual([])
  })
})
