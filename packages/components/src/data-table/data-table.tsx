'use client'
import {
  batch,
  cn,
  useComputed,
  useControllableSignal,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { Fragment, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Button } from '../button/button'
import { Checkbox } from '../checkbox/checkbox'
import styles from './data-table.module.css'

export interface Column<Row> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: Row) => ReactNode
  align?: 'start' | 'end'
  /**
   * Preferred column width, any CSS length (`'8rem'`, `'120px'`, `'12%'`). Set it on
   * identifier-shaped columns (ids, statuses, dates) so they stop stealing space from the
   * free-form ones.
   *
   * It is a *preferred* size with a **content floor**: a sized column never shrinks below
   * its own longest word, so you do not need a paired `minWidth` just to stop it
   * collapsing. Use `minWidth` only to raise the floor above the content.
   *
   * ⚠ **Sizing EVERY column changes the layout mode.** Only then does the table switch to
   * `table-layout: fixed` (which keeps widths identical across pages), and a fixed table
   * can exceed its container — the extra columns are reachable by horizontal scroll, not
   * dropped. Leave at least one free-form column unsized unless you specifically want
   * page-stable widths.
   *
   * ⚠ **"Leave one unsized" is necessary, not sufficient.** The leftover width is split
   * between the unsized columns by `table-layout: auto`, which weighs them by content — so
   * if the sized columns nearly fill the table, what remains can be narrower than the
   * content needs and long tokens wrap mid-word (`acme-` / `storefront`). Reported at
   * 6-of-8 columns sized. Rules of thumb: leave the widest free-form column unsized, keep
   * the sized columns to roughly two thirds of the table, and give the free-form one a
   * `minWidth` when the data has long unbreakable tokens like slugs or IDs.
   */
  width?: string
  /**
   * Floor for the column's width, any CSS length. Use it on a free-form column that should
   * get a minimum share, or to raise a sized column's floor above its content — the
   * content floor is automatic, so this is no longer needed merely to prevent collapse.
   */
  minWidth?: string
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
  previousPage?: string
  nextPage?: string
}

export interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  getRowId?: (row: Row) => string
  sort?: SortState
  defaultSort?: SortState
  sortMode?: 'client' | 'server'
  onSortChange?: (sort: SortState | undefined) => void
  /**
   * When true, shows a search/filter input.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  searchable?: boolean
  pagination?: { pageSize: number; pageSizeOptions?: number[] }
  selection?: { mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }
  batchActions?: { id?: string; label: string; onClick: (selectedIds: string[]) => void }[]
  renderExpandedRow?: (row: Row) => ReactNode
  /**
   * Row height preset.
   *
   * ⚠ It sets a row **height floor** (`--_row-height`), so it is invisible whenever the cell
   * content is already taller — a two-line cell or a cell containing a `Badge` stack looks
   * identical at every density. Reported as "barely distinguishable"; the prop is working,
   * the content is simply winning. Shrink the cell content, or set
   * `--cascivo-data-table-cell-gap` to tighten the horizontal rhythm too.
   *
   * @defaultValue `normal`
   * @see the component manifest
   */
  density?: 'compact' | 'normal' | 'relaxed'
  /**
   * When true, applies alternating row striping.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  zebra?: boolean
  /**
   * When true, the header stays fixed while the body scrolls.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  stickyHeader?: boolean
  /**
   * When true, shows a loading state.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  loading?: boolean
  emptyState?: ReactNode
  /** Visible caption above the table; it also becomes the table's accessible name. */
  title?: string
  /**
   * Invisible accessible name for the `<table>`, used when there is no visible `title`.
   *
   * A table with neither is an unnamed landmark for a screen reader — a real WCAG 1.3.1 /
   * 4.1.2 gap, and until 0.19 there was no way to fix it without rendering a caption you did
   * not want. Dev-warns when both are absent.
   */
  ariaLabel?: string
  description?: string
  labels?: DataTableLabels
  className?: string
  /**
   * Render only the visible row window for large datasets.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  virtualized?: boolean
  /**
   * Fixed row height in px, used to compute the virtualized window.
   *
   * @defaultValue `40`
   * @see the component manifest
   */
  rowHeight?: number
  /**
   * Number of rows rendered in the virtualized window.
   *
   * @defaultValue `20`
   * @see the component manifest
   */
  windowSize?: number
  /**
   * Extra rows rendered above/below the window to smooth scrolling.
   *
   * @defaultValue `3`
   * @see the component manifest
   */
  overscan?: number
}

interface Entry<Row> {
  row: Row
  id: string
}

const warnedUnnamedTable = new Set<string>()

/** True unless the build's NODE_ENV is 'production'. Read via `globalThis` so the
 * browser-facing source needs no `@types/node`, and it's safe where `process` is
 * absent (bundlers replace `process.env.NODE_ENV` in app builds). */
function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== 'production'
}

/**
 * Dev-only, deduped warning: a `<table>` with neither a visible `title` nor an `ariaLabel`
 * is an unnamed landmark. Screen-reader users land on it with no idea what it lists, and
 * nothing in a passing test suite says so. Keyed by column set, so a page of similar tables
 * warns once per shape rather than once per render.
 */
function warnIfUnnamed(title: string | undefined, ariaLabel: string | undefined, key: string) {
  if (!isDev()) return
  if (title !== undefined || ariaLabel !== undefined) return
  if (warnedUnnamedTable.has(key)) return
  warnedUnnamedTable.add(key)
  console.warn(
    `cascivo DataTable: this table has no accessible name (columns: ${key}). Pass \`title\` ` +
      'for a visible caption, or `ariaLabel` for a name only screen readers hear.',
  )
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
  ariaLabel,
  description,
  labels,
  className,
  virtualized = false,
  rowHeight = 40,
  windowSize = 20,
  overscan = 3,
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
    previousPage: labels?.previousPage ?? t(builtin.dataTable.previousPage),
    nextPage: labels?.nextPage ?? t(builtin.dataTable.nextPage),
  }
  const l = resolvedLabels

  /*
   * Every prop the `useComputed` chain below reads must reach it as a SIGNAL.
   *
   * `useComputed` memoises across renders and only re-runs when a signal it tracked changes,
   * so a computed closing over a plain prop silently serves the first render's value forever
   * — a filtered `rows` array stops updating and the table freezes on stale data. (Observed:
   * dropping these two mirrors broke the flow example's search filter while every DataTable
   * unit test still passed.)
   *
   * They go through the shared primitive rather than a hand-rolled `sig.value = prop`, which
   * is the shape CLAUDE.md forbids and the one that made controlled selection warn "Cannot
   * update a component while rendering a different component" under React 19 (2026-08-08
   * report A). `rows`/`columns` are always parent-owned, so they are always controlled.
   */
  const [rowsSignal] = useControllableSignal<Row[]>({ value: rows })
  const [columnsSignal] = useControllableSignal<Column<Row>[]>({ value: columns })
  const [sortSignal, setSort] = useControllableSignal<SortState | undefined>({
    value: sort,
    defaultValue: defaultSort,
  })

  /*
   * Selection deliberately does NOT mirror the controlled prop into a signal.
   *
   * Nothing derives from it — no `useComputed` reads it, only render and handlers do — so a
   * mirror bought nothing and cost the React 19 "Cannot update a component while rendering a
   * different component" warning that made the documented controlled API unusable
   * (2026-08-08 report A). Reading the prop directly is both simpler and correct: the parent
   * is the source of truth on every render, with no window in which the two disagree.
   */
  const uncontrolledSelected = useSignal<string[]>([])
  const selectedIds = selection?.selected ?? uncontrolledSelected.value
  const setSelected = (ids: string[]) => {
    if (selection?.selected === undefined) uncontrolledSelected.value = ids
    selection?.onChange?.(ids)
  }

  const querySignal = useSignal('')
  const pageSignal = useSignal(1)
  const pageSizeSignal = useSignal(pagination?.pageSize ?? 0)
  const expandedSignal = useSignal<ReadonlySet<string>>(new Set())

  // Virtualization
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTop = useSignal(0)

  useSignalEffect(() => {
    if (!virtualized) return
    const el = scrollContainerRef.current
    if (!el) return
    const onScroll = () => {
      flushSync(() => {
        scrollTop.value = el.scrollTop
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  })

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

  const visibleStart = useComputed(() =>
    virtualized ? Math.floor(scrollTop.value / rowHeight) : 0,
  )
  const visibleEnd = useComputed(() =>
    virtualized
      ? Math.min(visibleStart.value + windowSize + overscan * 2, paged.value.length)
      : paged.value.length,
  )
  const visibleEntries = useComputed<Entry<Row>[]>(() =>
    virtualized ? paged.value.slice(visibleStart.value, visibleEnd.value) : paged.value,
  )

  const cycleSort = (key: string) => {
    const current = sortSignal.value
    let next: SortState | undefined
    if (!current || current.key !== key) next = { key, direction: 'asc' }
    else if (current.direction === 'asc') next = { key, direction: 'desc' }
    else next = undefined
    batch(() => {
      setSort(next)
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

  const toggleRow = (id: string) => {
    const current = selectedIds
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
  const expanded = expandedSignal.value
  const allPageSelected =
    pageEntries.length > 0 && pageEntries.every((entry) => selectedIds.includes(entry.id))
  const somePageSelected = pageEntries.some((entry) => selectedIds.includes(entry.id))
  const renderedEntries = visibleEntries.value
  const vStart = visibleStart.value
  const vEnd = visibleEnd.value

  const toggleAll = () => {
    const pageIds = pageEntries.map((entry) => entry.id)
    if (allPageSelected) {
      setSelected(selectedIds.filter((id) => !pageIds.includes(id)))
    } else {
      setSelected([...new Set([...selectedIds, ...pageIds])])
    }
  }

  const colCount = columns.length + (selection ? 1 : 0) + (renderExpandedRow ? 1 : 0)
  // Pad partial pages with a spacer row so the table keeps a constant height —
  // the pagination controls stay put as the user pages through.
  const fillerCount =
    pagination && !virtualized && renderedEntries.length > 0
      ? Math.max(0, pageSizeSignal.value - renderedEntries.length)
      : 0
  warnIfUnnamed(title, ariaLabel, columns.map((c) => c.key).join(','))
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
      data-paginated={pagination ? true : undefined}
      // A fixed layout keeps column widths identical across pages, but it gives unsized
      // columns only the leftover space with no content floor — six sized columns out of
      // seven collapsed the seventh to ~50px and wrapped it one character per line. The
      // page-stability guarantee is only honourable when the caller has sized everything,
      // so that is exactly when it is applied.
      data-fixed-layout={columns.every((col) => col.width !== undefined) || undefined}
    >
      <span aria-live="polite" className={styles['srOnly']}>
        {selectedIds.length > 0 ? l.itemsSelected(selectedIds.length) : ''}
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
            {batchActions.map((action, i) => (
              <Button
                key={action.id ?? `${i}-${action.label}`}
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
      <div
        ref={virtualized ? scrollContainerRef : undefined}
        className={cn(styles['scroller'], virtualized && styles['scrollerVirtualized'])}
      >
        <table
          className={styles['table']}
          aria-labelledby={title !== undefined ? titleId : undefined}
          aria-label={title === undefined ? ariaLabel : undefined}
          aria-describedby={description !== undefined ? descriptionId : undefined}
          aria-busy={loading || undefined}
          aria-rowcount={virtualized ? pageEntries.length : undefined}
          onKeyDown={onTableKeyDown}
        >
          <colgroup>
            {renderExpandedRow && <col className={styles['controlCol']} />}
            {selection && <col className={styles['controlCol']} />}
            {columns.map((col) => (
              <col
                key={col.key}
                style={
                  col.width !== undefined || col.minWidth !== undefined
                    ? {
                        ...(col.width !== undefined ? { width: col.width } : {}),
                        ...(col.minWidth !== undefined ? { minWidth: col.minWidth } : {}),
                      }
                    : undefined
                }
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
                    data-sized={col.width !== undefined || undefined}
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
              <tr data-empty-row>
                <td colSpan={colCount} className={styles['emptyCell']}>
                  {emptyState ?? l.empty}
                </td>
              </tr>
            )}
            {!loading && virtualized && vStart > 0 && (
              <tr aria-hidden="true" style={{ height: vStart * rowHeight }} />
            )}
            {!loading &&
              renderedEntries.map((entry, index) => {
                const absoluteIndex = virtualized ? vStart + index : index
                const isSelected = selectedIds.includes(entry.id)
                const isExpanded = expanded.has(entry.id)
                return (
                  <Fragment key={entry.id}>
                    <tr
                      className={styles['row']}
                      data-parity={absoluteIndex % 2 === 0 ? 'even' : 'odd'}
                      data-state={isSelected ? 'selected' : undefined}
                      aria-rowindex={virtualized ? vStart + index + 1 : undefined}
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
                        <td
                          key={col.key}
                          data-align={col.align ?? 'start'}
                          data-sized={col.width !== undefined || undefined}
                        >
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
            {!loading && virtualized && vEnd < pageEntries.length && (
              <tr aria-hidden="true" style={{ height: (pageEntries.length - vEnd) * rowHeight }} />
            )}
            {fillerCount > 0 && (
              <tr aria-hidden="true" data-filler-row>
                <td
                  colSpan={colCount}
                  style={{ blockSize: `calc(var(--_row-height) * ${fillerCount})`, padding: 0 }}
                />
              </tr>
            )}
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
              aria-label={l.previousPage}
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
              aria-label={l.nextPage}
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
