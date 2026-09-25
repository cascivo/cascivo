import type { ReactNode } from 'react'
import type { Column, SortState } from './data-table'

/**
 * Adapter from TanStack Table column definitions to `DataTable`.
 *
 * A team moving to cascivo usually has `ColumnDef[]` arrays already written. This turns them
 * into `DataTable`'s `columns` and `rows` so the table renders with no rewrite, and converts
 * TanStack's `SortingState` to and from `SortState` for code that keeps sort state around.
 *
 * The types below are structural: this file imports nothing from TanStack, so it adds no
 * dependency, and a real `ColumnDef<Row>[]` is assignable to them.
 */

/** The part of TanStack's `CellContext` that a `cell` renderer is given here. */
export interface TanStackCellContext<Row> {
  getValue: () => unknown
  renderValue: () => unknown
  row: { original: Row; id: string; index: number }
  column: { id: string }
}

/** The subset of a TanStack `ColumnDef` this adapter reads. Other fields are ignored. */
export interface TanStackColumnDef<Row> {
  id?: string
  accessorKey?: PropertyKey
  accessorFn?: (row: Row, index: number) => unknown
  /**
   * A string is used as the header text. A header *function* renders against TanStack's own
   * header context, which does not exist here, so the column's id is shown instead.
   */
  header?: unknown
  /** A string, or a function of `TanStackCellContext` (`getValue()`, `row.original`). */
  cell?: unknown
  enableSorting?: boolean
  size?: number
  minSize?: number
  /** A group column: its leaf columns are flattened into the table. */
  columns?: readonly TanStackColumnDef<Row>[]
}

/** One entry of TanStack's `SortingState`. */
export interface TanStackSort {
  id: string
  desc: boolean
}

function leaves<Row>(defs: readonly TanStackColumnDef<Row>[]): TanStackColumnDef<Row>[] {
  return defs.flatMap((def) => (def.columns ? leaves(def.columns) : [def]))
}

function readPath(row: unknown, path: string): unknown {
  let value = row
  for (const part of path.split('.')) {
    if (value === null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return value
}

/**
 * Convert TanStack column definitions and their data into `DataTable` props.
 *
 * ```tsx
 * const { columns, rows } = fromTanStack(columnDefs, data)
 * <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
 * ```
 *
 * `DataTable` reads a cell by `row[column.key]`. A column with an `accessorFn` or a dotted
 * `accessorKey` (`'address.city'`) has no such property, so for those the returned rows are
 * shallow copies carrying the computed value under the column id — sorting, search, filters
 * and CSV export then see the same value the cell shows. With no such column the rows are
 * returned as given.
 */
export function fromTanStack<Row>(
  defs: readonly TanStackColumnDef<Row>[],
  data: readonly Row[],
): { columns: Column<Row>[]; rows: Row[] } {
  const computed: { key: string; read: (row: Row, index: number) => unknown }[] = []
  // Filled once the rows exist; cells render only after that.
  const indexByRow = new Map<Row, number>()
  const columns = leaves(defs).map((def): Column<Row> => {
    const accessorKey = def.accessorKey === undefined ? undefined : String(def.accessorKey)
    const key = def.id ?? accessorKey ?? (typeof def.header === 'string' ? def.header : '')
    if (!key) {
      throw new Error(
        'fromTanStack: a column has no id, accessorKey or string header — give it an `id`.',
      )
    }
    const accessorFn = def.accessorFn
    if (accessorFn) computed.push({ key, read: accessorFn })
    else if (accessorKey && (accessorKey.includes('.') || key !== accessorKey)) {
      computed.push({ key, read: (row) => readPath(row, accessorKey) })
    }
    const hasValue = accessorFn !== undefined || accessorKey !== undefined
    const column: Column<Row> = {
      key,
      header: typeof def.header === 'string' ? def.header : key,
      sortable: hasValue && def.enableSorting !== false,
    }
    const cell = def.cell
    if (typeof cell === 'function') {
      const renderCell = cell as (ctx: TanStackCellContext<Row>) => ReactNode
      column.render = (row) => {
        const index = indexByRow.get(row) ?? -1
        const value = () => (row as Record<string, unknown>)[key]
        return renderCell({
          getValue: value,
          renderValue: value,
          row: { original: row, id: String(index), index },
          column: { id: key },
        })
      }
    } else if (typeof cell === 'string') {
      column.render = () => cell
    }
    if (def.size !== undefined) column.width = `${def.size}px`
    if (def.minSize !== undefined) column.minWidth = `${def.minSize}px`
    return column
  })

  const rows =
    computed.length === 0
      ? [...data]
      : data.map((row, index) => {
          const copy = { ...row } as Record<string, unknown>
          for (const { key, read } of computed) copy[key] = read(row, index)
          return copy as Row
        })
  rows.forEach((row, index) => indexByRow.set(row, index))
  return { columns, rows }
}

/** TanStack `SortingState` → `SortState` (the first entry sorts, the rest break ties). */
export function toSortState(sorting: readonly TanStackSort[]): SortState | undefined {
  const [first, ...rest] = sorting
  if (!first) return undefined
  const state: SortState = { key: first.id, direction: first.desc ? 'desc' : 'asc' }
  if (rest.length > 0) {
    state.thenBy = rest.map((s) => ({ key: s.id, direction: s.desc ? 'desc' : 'asc' }))
  }
  return state
}

/** `SortState` → TanStack `SortingState`. */
export function toTanStackSorting(sort: SortState | undefined): TanStackSort[] {
  if (!sort) return []
  return [sort, ...(sort.thenBy ?? [])].map((s) => ({ id: s.key, desc: s.direction === 'desc' }))
}
