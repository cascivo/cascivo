'use client'
import { batch, cn, useComputed, useSignal, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { Fragment, useId, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '../button/button'
import { Checkbox } from '../checkbox/checkbox'
import styles from './data-table.module.css'

export interface Column<Row> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: Row) => ReactNode
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
  renderExpandedRow?: (row: Row) => ReactNode
  density?: 'compact' | 'normal' | 'relaxed'
  zebra?: boolean
  stickyHeader?: boolean
  loading?: boolean
  emptyState?: ReactNode
  title?: string
  description?: string
  labels?: DataTableLabels
  className?: string
}

interface Entry<Row> {
  row: Row
  id: string
}

function cellValue<Row>(row: Row, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  sort,
  defaultSort,
  sortMode = 'client',
  onSortChange,
  searchable = false,
  pagination,
  selection,
  batchActions,
  renderExpandedRow,
  density = 'normal',
  zebra = false,
  stickyHeader = false,
  loading = false,
  emptyState,
  title,
  description,
  labels,
  className,
}: DataTableProps<Row>) {
  useSignals()
  const baseId = useId()
  const resolvedLabels = {
    search: labels?.search ?? t(builtin.dataTable.search),
    empty: labels?.empty ?? t(builtin.dataTable.empty),
    selectAll: labels?.selectAll ?? t(builtin.dataTable.selectAll),
    selectRow: labels?.selectRow ?? t(builtin.dataTable.selectRow),
    itemsSelected: (n: number) =>
      labels?.itemsSelected?.(n) ?? t(builtin.dataTable.itemsSelected, { count: n }),
    expandRow: labels?.expandRow ?? t(builtin.dataTable.expandRow),
  }
  const l = resolvedLabels

  // Sync props into signals during render so computeds see fresh data.
  const rowsSignal = useSignal(rows)
  rowsSignal.value = rows
  const columnsSignal = useSignal(columns)
  columnsSignal.value = columns

  const sortSignal = useSignal<SortState | undefined>(sort ?? defaultSort)
  if (sort !== undefined) sortSignal.value = sort

  const selectedSignal = useSignal<string[]>(selection?.selected ?? [])
  if (selection?.selected !== undefined) selectedSignal.value = selection.selected

  const querySignal = useSignal('')
  const pageSignal = useSignal(1)
  const pageSizeSignal = useSignal(pagination?.pageSize ?? 0)
  const expandedSignal = useSignal<ReadonlySet<string>>(new Set())

  const entries = useComputed<Entry<Row>[]>(() =>
    rowsSignal.value.map((row, index) => ({
      row,
      id: getRowId ? getRowId(row) : String(index),
    })),
  )

  const filtered = useComputed<Entry<Row>[]>(() => {
    const query = querySignal.value.trim().toLowerCase()
    if (!query) return entries.value
    const cols = columnsSignal.value
    return entries.value.filter((entry) =>
      cols.some((col) =>
        String(cellValue(entry.row, col.key) ?? '')
          .toLowerCase()
          .includes(query),
      ),
    )
  })

  const sorted = useComputed<Entry<Row>[]>(() => {
    const current = sortSignal.value
    if (!current || sortMode === 'server') return filtered.value
    const indexed = filtered.value.map((entry, index) => [entry, index] as const)
    indexed.sort((a, b) => {
      let result = compareValues(cellValue(a[0].row, current.key), cellValue(b[0].row, current.key))
      if (current.direction === 'desc') result = -result
      return result !== 0 ? result : a[1] - b[1]
    })
    return indexed.map(([entry]) => entry)
  })

  const pageCount = useComputed(() =>
    pagination ? Math.max(1, Math.ceil(filtered.value.length / pageSizeSignal.value)) : 1,
  )
  const currentPage = useComputed(() => Math.min(pageSignal.value, pageCount.value))
  const paged = useComputed<Entry<Row>[]>(() => {
    if (!pagination) return sorted.value
    const start = (currentPage.value - 1) * pageSizeSignal.value
    return sorted.value.slice(start, start + pageSizeSignal.value)
  })

  const cycleSort = (key: string) => {
    const current = sortSignal.value
    let next: SortState | undefined
    if (!current || current.key !== key) next = { key, direction: 'asc' }
    else if (current.direction === 'asc') next = { key, direction: 'desc' }
    else next = undefined
    batch(() => {
      if (sort === undefined) sortSignal.value = next
      pageSignal.value = 1
    })
    onSortChange?.(next)
  }

  const onTableKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
    const table = e.currentTarget
    const focusables = Array.from(
      table.querySelectorAll<HTMLElement>('th button, td button, td input[type="checkbox"]'),
    )
    const index = focusables.indexOf(document.activeElement as HTMLElement)
    if (index === -1) return
    e.preventDefault()
    const row = (el: HTMLElement) => el.closest('tr')
    let next: HTMLElement | undefined
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const candidate = focusables[index + dir]
      if (candidate && row(candidate) === row(focusables[index]!)) next = candidate
    } else {
      const dir = e.key === 'ArrowDown' ? 1 : -1
      const current = focusables[index]!
      for (let i = index + dir; i >= 0 && i < focusables.length; i += dir) {
        if (row(focusables[i]!) !== row(current)) {
          next = focusables[i]
          break
        }
      }
    }
    next?.focus()
  }

  const setSelected = (ids: string[]) => {
    if (selection?.selected === undefined) selectedSignal.value = ids
    selection?.onChange?.(ids)
  }

  const toggleRow = (id: string) => {
    const current = selectedSignal.value
    if (selection?.mode === 'single') {
      setSelected(current.includes(id) ? [] : [id])
    } else {
      setSelected(current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
    }
  }

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedSignal.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedSignal.value = next
  }

  const pageEntries = paged.value
  const selectedIds = selectedSignal.value
  const expanded = expandedSignal.value
  const allPageSelected =
    pageEntries.length > 0 && pageEntries.every((entry) => selectedIds.includes(entry.id))
  const somePageSelected = pageEntries.some((entry) => selectedIds.includes(entry.id))

  const toggleAll = () => {
    const pageIds = pageEntries.map((entry) => entry.id)
    if (allPageSelected) {
      setSelected(selectedIds.filter((id) => !pageIds.includes(id)))
    } else {
      setSelected([...new Set([...selectedIds, ...pageIds])])
    }
  }

  const colCount = columns.length + (selection ? 1 : 0) + (renderExpandedRow ? 1 : 0)
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  const totalRows = filtered.value.length
  const rangeStart = totalRows === 0 ? 0 : (currentPage.value - 1) * pageSizeSignal.value + 1
  const rangeEnd = totalRows === 0 ? 0 : rangeStart + pageEntries.length - 1
  const showBatchBar = !!batchActions && batchActions.length > 0 && selectedIds.length > 0

  return (
    <div
      className={cn(styles['root'], className)}
      data-density={density}
      data-zebra={zebra || undefined}
      data-sticky-header={stickyHeader || undefined}
    >
      <span aria-live="polite" className={styles['srOnly']}>
        {selectedSignal.value.length > 0 ? l.itemsSelected(selectedSignal.value.length) : ''}
      </span>
      {(title !== undefined || description !== undefined || searchable) && (
        <div className={styles['toolbar']}>
          {(title !== undefined || description !== undefined) && (
            <div className={styles['heading']}>
              {title !== undefined && (
                <div id={titleId} className={styles['title']}>
                  {title}
                </div>
              )}
              {description !== undefined && (
                <div id={descriptionId} className={styles['description']}>
                  {description}
                </div>
              )}
            </div>
          )}
          {searchable && (
            <input
              type="search"
              className={styles['search']}
              aria-label={l.search}
              placeholder={l.search}
              value={querySignal.value}
              onChange={(event) => {
                querySignal.value = event.target.value
                pageSignal.value = 1
              }}
            />
          )}
        </div>
      )}
      {showBatchBar && (
        <div className={styles['batchBar']}>
          <span className={styles['batchCount']}>{l.itemsSelected(selectedIds.length)}</span>
          <div className={styles['batchActions']}>
            {batchActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="secondary"
                onClick={() => action.onClick(selectedIds)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className={styles['scroller']}>
        <table
          className={styles['table']}
          aria-labelledby={title !== undefined ? titleId : undefined}
          aria-describedby={description !== undefined ? descriptionId : undefined}
          aria-busy={loading || undefined}
          onKeyDown={onTableKeyDown}
        >
          <colgroup>
            {renderExpandedRow && <col className={styles['controlCol']} />}
            {selection && <col className={styles['controlCol']} />}
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width !== undefined ? { width: col.width } : undefined}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {renderExpandedRow && (
                <th scope="col" className={styles['controlCell']}>
                  <span className={styles['srOnly']}>{l.expandRow}</span>
                </th>
              )}
              {selection && (
                <th scope="col" className={styles['controlCell']}>
                  {selection.mode === 'multi' ? (
                    <Checkbox
                      aria-label={l.selectAll}
                      checked={allPageSelected}
                      indeterminate={somePageSelected && !allPageSelected}
                      onChange={toggleAll}
                    />
                  ) : (
                    <span className={styles['srOnly']}>{l.selectRow}</span>
                  )}
                </th>
              )}
              {columns.map((col) => {
                const direction =
                  sortSignal.value?.key === col.key ? sortSignal.value.direction : undefined
                const ariaSort =
                  direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'
                return (
                  <th
                    key={col.key}
                    scope="col"
                    data-align={col.align ?? 'start'}
                    aria-sort={col.sortable ? ariaSort : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={styles['sortButton']}
                        data-state={ariaSort}
                        onClick={() => cycleSort(col.key)}
                      >
                        {col.header}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }, (_, rowIndex) => (
                <tr key={rowIndex} className={styles['row']}>
                  {Array.from({ length: colCount }, (_, cellIndex) => (
                    <td key={cellIndex}>
                      <span className={styles['shimmer']} aria-hidden="true" />
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && pageEntries.length === 0 && (
              <tr>
                <td colSpan={colCount} className={styles['emptyCell']}>
                  {emptyState ?? l.empty}
                </td>
              </tr>
            )}
            {!loading &&
              pageEntries.map((entry, index) => {
                const isSelected = selectedIds.includes(entry.id)
                const isExpanded = expanded.has(entry.id)
                return (
                  <Fragment key={entry.id}>
                    <tr
                      className={styles['row']}
                      data-parity={index % 2 === 0 ? 'even' : 'odd'}
                      data-state={isSelected ? 'selected' : undefined}
                    >
                      {renderExpandedRow && (
                        <td className={styles['controlCell']}>
                          <button
                            type="button"
                            className={styles['expandButton']}
                            aria-expanded={isExpanded}
                            aria-label={l.expandRow}
                            data-state={isExpanded ? 'open' : 'closed'}
                            onClick={() => toggleExpanded(entry.id)}
                          >
                            <span className={styles['chevron']} aria-hidden="true" />
                          </button>
                        </td>
                      )}
                      {selection && (
                        <td className={styles['controlCell']}>
                          <Checkbox
                            aria-label={l.selectRow}
                            checked={isSelected}
                            onChange={() => toggleRow(entry.id)}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} data-align={col.align ?? 'start'}>
                          {col.render
                            ? col.render(entry.row)
                            : String(cellValue(entry.row, col.key) ?? '')}
                        </td>
                      ))}
                    </tr>
                    {renderExpandedRow && (
                      <tr
                        className={styles['expansionRow']}
                        data-state={isExpanded ? 'open' : 'closed'}
                      >
                        <td colSpan={colCount}>
                          <div
                            className={styles['expansionGrid']}
                            data-state={isExpanded ? 'open' : 'closed'}
                          >
                            <div className={styles['expansionInner']}>
                              {renderExpandedRow(entry.row)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className={styles['footer']}>
          {pagination.pageSizeOptions && (
            <label className={styles['pageSize']}>
              <span>Rows per page</span>
              <select
                value={pageSizeSignal.value}
                onChange={(event) => {
                  pageSizeSignal.value = Number(event.target.value)
                  pageSignal.value = 1
                }}
              >
                {pagination.pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className={styles['range']}>
            {rangeStart}–{rangeEnd} of {totalRows}
          </span>
          <div className={styles['pageButtons']}>
            <button
              type="button"
              className={styles['pageButton']}
              aria-label="Previous page"
              disabled={currentPage.value <= 1}
              onClick={() => {
                pageSignal.value = currentPage.value - 1
              }}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className={styles['pageButton']}
              aria-label="Next page"
              disabled={currentPage.value >= pageCount.value}
              onClick={() => {
                pageSignal.value = currentPage.value + 1
              }}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
