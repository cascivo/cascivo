import type { ComponentChildren } from 'preact'

export interface Column<Row> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: Row) => ComponentChildren
  align?: 'start' | 'end'
  width?: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

export interface DataTableLabels {
  search?: string
  empty?: string
  selectAll?: string
  selectRow?: string
  itemsSelected?: (n: number) => string
  expandRow?: string
}

export interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  getRowId?: (row: Row) => string
  sort?: SortState
  defaultSort?: SortState
  sortMode?: 'client' | 'server'
  onSortChange?: (sort: SortState | undefined) => void
  searchable?: boolean
  pagination?: { pageSize: number; pageSizeOptions?: number[] }
  selection?: { mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }
  batchActions?: { label: string; onClick: (selectedIds: string[]) => void }[]
  renderExpandedRow?: (row: Row) => ComponentChildren
  density?: 'compact' | 'normal' | 'relaxed'
  zebra?: boolean
  stickyHeader?: boolean
  loading?: boolean
  emptyState?: ComponentChildren
  title?: string
  description?: string
  labels?: DataTableLabels
  className?: string
}

export declare function DataTable<Row>(props: DataTableProps<Row>): JSX.Element
