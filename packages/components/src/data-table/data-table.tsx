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
import { OverflowMenu } from '../overflow-menu/overflow-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover'
import styles from './data-table.module.css'
import {
  applyColumnFilters,
  countActiveFilters,
  facetValues,
  isFilterActive,
  numericExtent,
} from './column-filter'
import type { ColumnFilterKind, ColumnFilters, ColumnFilterValue, Facet } from './column-filter'
import { createRowSearch } from './row-search'
import { sortRows } from './row-sort'
import { computeWindow } from './virtual-window'

export interface Column<Row> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: Row) => ReactNode
  align?: 'start' | 'end'
  /**
   * Offer a per-column filter in a row under the header: `'text'` is a substring input,
   * `'select'` a faceted checklist of the column's distinct values with counts, `'range'` a
   * numeric min/max pair. Filters AND together and combine with the global search; the
   * current values are readable and controllable through the `filters` props.
   */
  filter?: ColumnFilterKind
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
   * You do not have to get this right by arithmetic: the table **measures** its own overflow
   * and warns in dev with the real `scrollWidth`/`clientWidth` and the sized columns to
   * change. In production a scrolling shadow marks the cut edge. The rules of thumb below are
   * a starting point, not something to compute against a container width you cannot see.
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

/** One entry in a row's actions menu (`rowActions`). */
export interface RowAction<Row> {
  id: string
  label: string
  /** Activation handler; receives the row the menu belongs to. */
  onSelect: (row: Row) => void
  destructive?: boolean
  disabled?: boolean
  icon?: ReactNode
}

/** Everything the table needs the server to apply, when `server` is set. */
export interface TableQuery {
  sort: SortState | undefined
  /** Trimmed global search text; empty when the box is blank. */
  search: string
  filters: ColumnFilters
  /** 1-based page. */
  page: number
  pageSize: number
}

/**
 * Server-driven mode: the table renders `rows` as the current page verbatim and asks the
 * server for anything that would change them. Sort, search, per-column filters and paging
 * all stop running on the client at once — one switch, not four.
 */
export interface DataTableServer {
  /** Total rows across every page; drives the pager and the range label. */
  totalItems?: number
  /**
   * Called with the full query whenever sort, search, a filter, the page or the page size
   * changes. Not called on mount: the rows you passed for the initial render are the first
   * page.
   */
  onQueryChange: (query: TableQuery) => void
}

/**
 * User-adjustable column layout — what a "Columns" menu, a header menu or a persisted
 * preference changes. One object so it round-trips through storage or a URL as a unit.
 */
export interface ColumnState {
  /** Keys of hidden columns. At least one column always stays visible. */
  hidden?: string[]
}

/** Which column-layout controls the table offers. All off by default. */
export interface ColumnSettings {
  /** A "Columns" menu in the toolbar that shows and hides columns. */
  visibility?: boolean
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
  columns?: string
  actions?: string
  noResults?: string
  clearFilters?: string
  filterColumn?: (column: string) => string
  min?: string
  max?: string
  all?: string
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
  /**
   * Client-side paging, or the pager for a `server`-driven table. `page` makes the current
   * page controlled; with `server`, `pageSize`/`page` are echoed back in every `TableQuery`.
   */
  pagination?: {
    pageSize: number
    pageSizeOptions?: number[]
    page?: number
    onPageChange?: (page: number) => void
  }
  selection?: { mode: 'single' | 'multi'; selected?: string[]; onChange?: (ids: string[]) => void }
  batchActions?: { id?: string; label: string; onClick: (selectedIds: string[]) => void }[]
  renderExpandedRow?: (row: Row) => ReactNode
  /** Per-column filter values (controlled). Columns opt in with `Column.filter`. */
  filters?: ColumnFilters
  /** Initial per-column filter values (uncontrolled). */
  defaultFilters?: ColumnFilters
  /** Called with the full filter map whenever any column filter changes. */
  onFiltersChange?: (filters: ColumnFilters) => void
  /**
   * Shown instead of `emptyState` when there ARE rows but the search or filters match none
   * of them — a different message from "no data", and the moment to offer a reset.
   */
  noResultsState?: ReactNode
  /** Extra controls rendered in the toolbar, next to the search box (exports, primary actions). */
  toolbar?: ReactNode
  /**
   * Per-row actions. Returns the menu entries for a row; the table renders them as a
   * trailing "⋯" overflow menu column, keyboard-reachable like every other cell control.
   */
  rowActions?: (row: Row) => RowAction<Row>[]
  /** Column layout (controlled): hidden columns. See {@link ColumnState}. */
  columnState?: ColumnState
  /** Initial column layout (uncontrolled). */
  defaultColumnState?: ColumnState
  /** Called with the full column layout whenever the user changes it. */
  onColumnStateChange?: (state: ColumnState) => void
  /** Which column-layout controls to offer; see {@link ColumnSettings}. */
  columnSettings?: ColumnSettings
  /** Hand sort, search, filters and paging to the server; see {@link DataTableServer}. */
  server?: DataTableServer
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
   * Row height in px for the virtualized window.
   *
   * Measured from the first rendered row when omitted, so the density presets stay correct
   * — the old fixed default of 40 never matched them (rows are 36/48/60 px plus a border),
   * and a wrong value scales the whole scrollbar. Set it only for custom-sized rows.
   */
  rowHeight?: number
  /**
   * Rows rendered per window. Derived from the scroller's height when omitted; set it only
   * to render a fixed count regardless of height.
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
  /** Lower-cased searchable text, built on first use (see `search` below). */
  haystack?: string
}

const warnedUnnamedTable = new Set<string>()

/** True unless the build's NODE_ENV is 'production'. Read via `globalThis` so the
 * browser-facing source needs no `@types/node`, and it's safe where `process` is
 * absent (bundlers replace `process.env.NODE_ENV` in app builds). */
function isDev(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== 'production'
}

const warnedOverflow = new Set<string>()

/**
 * Dev-only, deduped warning: the table is wider than its container.
 *
 * `Column.width`'s doc comment is two ⚠ blocks and a paragraph of rules of thumb ("keep the
 * sized columns to roughly two thirds"), and an adopter who read all of it still needed three
 * passes — because the arithmetic depends on the container width, which the component knows
 * and they do not. Their second attempt grew the table past its card and cut the last column
 * off with no visible scroll affordance, which reads as a styling choice rather than a bug
 * (2026-08-22 report item 17).
 *
 * Overflow is measured, not predicted, so this fires only on the real failure and stays silent
 * on a configuration that fits — a warning that fires on the correct answer is worse than none.
 */
function warnIfOverflowing(el: HTMLElement, sized: string[], key: string): void {
  if (!isDev()) return
  const overflowBy = el.scrollWidth - el.clientWidth
  // 1px of slop: sub-pixel layout rounding routinely reports a scrollWidth one larger.
  if (overflowBy <= 1) return
  const dedupeKey = `${key}:${el.clientWidth}`
  if (warnedOverflow.has(dedupeKey)) return
  warnedOverflow.add(dedupeKey)
  console.warn(
    `cascivo DataTable: the table overflows its container (scrollWidth ${el.scrollWidth}px > ` +
      `clientWidth ${el.clientWidth}px, by ${overflowBy}px), so the last column is cut off. ` +
      (sized.length > 0
        ? `Drop a \`width\` from one of the sized columns (${sized.join(', ')}), or lower the ` +
          '`minWidth` on the free-form one.'
        : 'Lower the `minWidth` on the widest column.'),
  )
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
  filters,
  defaultFilters,
  onFiltersChange,
  noResultsState,
  toolbar,
  rowActions,
  columnState,
  defaultColumnState,
  onColumnStateChange,
  columnSettings,
  server,
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
  rowHeight,
  windowSize,
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
    columns: labels?.columns ?? t(builtin.dataTable.columns),
    actions: labels?.actions ?? t(builtin.dataTable.actions),
    noResults: labels?.noResults ?? t(builtin.dataTable.noResults),
    clearFilters: labels?.clearFilters ?? t(builtin.dataTable.clearFilters),
    filterColumn: (column: string) =>
      labels?.filterColumn?.(column) ?? t(builtin.dataTable.filterColumn, { column }),
    min: labels?.min ?? t(builtin.dataTable.min),
    max: labels?.max ?? t(builtin.dataTable.max),
    all: labels?.all ?? t(builtin.dataTable.all),
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
  // Page, filters and hidden columns are all controllable the same way sort is.
  const [pageSignal, setPage] = useControllableSignal<number>({
    value: pagination?.page,
    defaultValue: 1,
    onChange: pagination?.onPageChange,
  })
  const [filtersSignal, setFilters] = useControllableSignal<ColumnFilters>({
    value: filters,
    defaultValue: defaultFilters ?? {},
    onChange: onFiltersChange,
  })
  const [columnStateSignal, setColumnState] = useControllableSignal<ColumnState>({
    value: columnState,
    defaultValue: defaultColumnState ?? {},
    onChange: onColumnStateChange,
  })
  // The columns actually rendered. Never empty: hiding the last one is refused, so a
  // stray persisted state cannot produce a table with no columns.
  const visibleColumns = useComputed<Column<Row>[]>(() => {
    const hidden = new Set(columnStateSignal.value.hidden ?? [])
    const shown = columnsSignal.value.filter((col) => !hidden.has(col.key))
    return shown.length > 0 ? shown : columnsSignal.value
  })
  const pageSizeSignal = useSignal(pagination?.pageSize ?? 0)
  const expandedSignal = useSignal<ReadonlySet<string>>(new Set())

  // Virtualization
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollTop = useSignal(0)
  const viewportHeight = useSignal(0)
  const measuredRowHeight = useSignal(0)

  /**
   * Measure overflow whenever the container resizes. A trailing rAF keeps a mid-resize
   * transient (a sidebar animating open) from logging; the observer is the only way to catch
   * the case at all, since the table fits at some widths and not others.
   */
  useSignalEffect(() => {
    const el = scrollContainerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const sized = columns.filter((c) => c.width !== undefined).map((c) => c.key)
    const key = columns.map((c) => c.key).join(',')
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        warnIfOverflowing(el, sized, key)
        // The sticky filter row sits under the header row, whose height depends on font
        // and density; measured here so it never overlaps.
        const headRow = el.querySelector<HTMLElement>('thead tr')
        if (headRow)
          el.style.setProperty('--_head-h', `${headRow.getBoundingClientRect().height}px`)
      })
    })
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  })

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

  /**
   * Measure what the window math needs instead of trusting props for it: the scroller's
   * height (so a taller table renders more rows rather than blank canvas) and the real row
   * height (the density presets size rows in rem, plus a border). The table is observed as
   * well as the scroller so a density change, which re-sizes rows without resizing the
   * scroller, is picked up too.
   */
  useSignalEffect(() => {
    if (!virtualized) return
    const el = scrollContainerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      viewportHeight.value = el.clientHeight
      const row = el.querySelector<HTMLElement>('tbody tr[aria-rowindex]')
      const height = row?.getBoundingClientRect().height ?? 0
      if (height > 0) measuredRowHeight.value = height
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    const table = el.querySelector('table')
    if (table) observer.observe(table)
    return () => observer.disconnect()
  })

  const entries = useComputed<Entry<Row>[]>(() => {
    // Entries cache their search haystack, which is a function of the visible columns, so
    // a new column set means new entries. Columns change rarely; rows are the common case.
    void visibleColumns.value
    return rowsSignal.value.map((row, index) => ({
      row,
      id: getRowId ? getRowId(row) : String(index),
    }))
  })

  /*
   * Sort first, filter second. Filtering preserves order, so the sort runs once per sort
   * change and a search keystroke only filters — the old filter-then-sort order re-sorted
   * the whole filtered set on every key, which under an active sort was the bulk of the
   * ~300–800 ms a keystroke cost at a million rows.
   */
  const sorted = useComputed<readonly Entry<Row>[]>(() => {
    const current = sortSignal.value
    if (!current || sortMode === 'server' || server) return entries.value
    return sortRows(entries.value, (entry) => cellValue(entry.row, current.key), current.direction)
  })

  // Per-column filters run on the sorted rows (order-preserving), before the global search
  // narrows further. Nothing runs when no filter is active — `applyColumnFilters` hands
  // back the same array, so the memos below keep their identity.
  const columnFiltered = useComputed<readonly Entry<Row>[]>(() =>
    server
      ? sorted.value
      : applyColumnFilters(sorted.value, filtersSignal.value, (entry, key) =>
          cellValue(entry.row, key),
        ),
  )

  // One lower-cased haystack per row, cached on the entry (a field read per row per
  // keystroke, where a `Map` lookup measured ~3x slower); the search narrows an extended
  // query from the previous result.
  const search = useComputed(() => {
    const cols = visibleColumns.value
    return createRowSearch<Entry<Row>>((entry) => {
      if (entry.haystack === undefined) {
        let hay = ''
        for (const col of cols) {
          // A control character between cells so a query cannot match across the boundary.
          hay += String(cellValue(entry.row, col.key) ?? '') + '\u0000'
        }
        entry.haystack = hay.toLowerCase()
      }
      return entry.haystack
    })
  })

  // Prime the haystacks in idle time so the first keystroke does not build the whole
  // index at once (~1.5 s at a million rows). Chunked, and abandoned the moment the rows
  // or columns change (a new `entries`) or the table unmounts.
  useSignalEffect(() => {
    if (!searchable) return
    const rows = entries.value
    const index = search.value
    // `requestIdleCallback` where it exists (not Safari); a short timeout otherwise. The
    // handle is typed loosely because the two APIs, and Node's `setTimeout`, disagree.
    const hasIdle = typeof requestIdleCallback === 'function'
    let handle: unknown
    let next = 0
    const step = () => {
      next = index.prime(rows, next, 20_000)
      if (next < rows.length) schedule()
    }
    const schedule = () => {
      handle = hasIdle ? requestIdleCallback(step, { timeout: 500 }) : setTimeout(step, 16)
    }
    schedule()
    return () => {
      if (hasIdle) cancelIdleCallback(handle as number)
      else clearTimeout(handle as ReturnType<typeof setTimeout>)
    }
  })

  const filtered = useComputed<readonly Entry<Row>[]>(() => {
    if (server) return sorted.value
    const query = querySignal.value.trim().toLowerCase()
    return query ? search.value.filter(columnFiltered.value, query) : columnFiltered.value
  })

  const clientPageCount = useComputed(() =>
    pagination ? Math.max(1, Math.ceil(filtered.value.length / pageSizeSignal.value)) : 1,
  )
  const clientPage = useComputed(() => Math.min(pageSignal.value, clientPageCount.value))
  const paged = useComputed<readonly Entry<Row>[]>(() => {
    // In server mode `rows` already IS the page.
    if (!pagination || server) return filtered.value
    const start = (clientPage.value - 1) * pageSizeSignal.value
    return filtered.value.slice(start, start + pageSizeSignal.value)
  })

  // Server mode: report the query whenever any part of it changes. The effect's first run
  // only subscribes — the rows passed for the initial render are the first page — and the
  // callback is read through a ref so a new closure per render never re-triggers it.
  const serverRef = useRef(server)
  serverRef.current = server
  const querySubscribedRef = useRef(false)
  useSignalEffect(() => {
    const query: TableQuery = {
      sort: sortSignal.value,
      search: querySignal.value.trim(),
      filters: filtersSignal.value,
      page: pageSignal.value,
      pageSize: pageSizeSignal.value,
    }
    if (!querySubscribedRef.current) {
      querySubscribedRef.current = true
      return
    }
    serverRef.current?.onQueryChange(query)
  })

  const setColumnFilter = (key: string, value: ColumnFilterValue | undefined) => {
    const next: ColumnFilters = { ...filtersSignal.value }
    if (value && isFilterActive(value)) next[key] = value
    else delete next[key]
    batch(() => {
      setFilters(next)
      setPage(1)
    })
  }
  const clearFilters = () =>
    batch(() => {
      setFilters({})
      setPage(1)
    })
  const toggleColumn = (key: string) => {
    const state = columnStateSignal.value
    const hidden = state.hidden ?? []
    setColumnState({
      ...state,
      hidden: hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key],
    })
  }

  // Facets and extents are one pass over every row, so they are computed on first use per
  // (rows, column) and kept until the rows change — never per keystroke or per render.
  const facetOpen = useSignal<string | null>(null)
  const facetCacheRef = useRef<{
    entries: readonly Entry<Row>[]
    facets: Map<string, Facet[]>
    extents: Map<string, { min: number; max: number } | undefined>
  } | null>(null)
  const facetCache = () => {
    const all = entries.value
    if (facetCacheRef.current?.entries !== all) {
      facetCacheRef.current = { entries: all, facets: new Map(), extents: new Map() }
    }
    return facetCacheRef.current
  }
  const facetsOf = (key: string): Facet[] => {
    const cache = facetCache()
    let f = cache.facets.get(key)
    if (!f) {
      f = facetValues(cache.entries, (entry) => cellValue(entry.row, key))
      cache.facets.set(key, f)
    }
    return f
  }
  const extentOf = (key: string) => {
    const cache = facetCache()
    if (!cache.extents.has(key)) {
      cache.extents.set(
        key,
        numericExtent(cache.entries, (entry) => cellValue(entry.row, key)),
      )
    }
    return cache.extents.get(key)
  }

  const cycleSort = (key: string) => {
    const current = sortSignal.value
    let next: SortState | undefined
    if (!current || current.key !== key) next = { key, direction: 'asc' }
    else if (current.direction === 'asc') next = { key, direction: 'desc' }
    else next = undefined
    batch(() => {
      setSort(next)
      setPage(1)
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

  /*
   * Selection membership as a Set, rebuilt only when the `selectedIds` array changes
   * identity. `selectedIds.includes` per rendered row is O(selected), and with every row of
   * a million selected that was ~300 ms per render — per scroll frame. A ref holds the memo
   * because selection is deliberately not a signal (see above), so `useComputed` cannot
   * key on it; this is a cache keyed by identity, not component state.
   */
  const selectedSetRef = useRef<{ ids: string[]; set: ReadonlySet<string> } | null>(null)
  if (selectedSetRef.current?.ids !== selectedIds) {
    selectedSetRef.current = { ids: selectedIds, set: new Set(selectedIds) }
  }
  const selectedSet = selectedSetRef.current.set

  const toggleRow = (id: string) => {
    const current = selectedIds
    if (selection?.mode === 'single') {
      setSelected(selectedSet.has(id) ? [] : [id])
    } else {
      setSelected(selectedSet.has(id) ? current.filter((x) => x !== id) : [...current, id])
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

  // The header checkbox state is a walk over the whole page — a million rows without
  // pagination — so it is recomputed only when the page or the selection changes, never
  // on a scroll frame. Same identity-keyed cache as `selectedSet`.
  const pageSelectionRef = useRef<{
    page: readonly Entry<Row>[]
    set: ReadonlySet<string>
    all: boolean
    some: boolean
  } | null>(null)
  if (
    pageSelectionRef.current?.page !== pageEntries ||
    pageSelectionRef.current.set !== selectedSet
  ) {
    pageSelectionRef.current = {
      page: pageEntries,
      set: selectedSet,
      all: pageEntries.length > 0 && pageEntries.every((entry) => selectedSet.has(entry.id)),
      some: pageEntries.some((entry) => selectedSet.has(entry.id)),
    }
  }
  const allPageSelected = pageSelectionRef.current.all
  const somePageSelected = pageSelectionRef.current.some

  // Row window. Row height and viewport come from measurement unless overridden; the
  // fallbacks only matter where nothing can be measured (SSR, jsdom).
  const rowPx = rowHeight ?? (measuredRowHeight.value > 0 ? measuredRowHeight.value : 40)
  const viewportPx =
    windowSize !== undefined
      ? windowSize * rowPx
      : viewportHeight.value > 0
        ? viewportHeight.value
        : 20 * rowPx
  const rowWindow = virtualized
    ? computeWindow({
        scrollTop: scrollTop.value,
        viewportHeight: viewportPx,
        rowHeight: rowPx,
        count: pageEntries.length,
        overscan,
      })
    : undefined
  const renderedEntries = rowWindow
    ? pageEntries.slice(rowWindow.start, rowWindow.end)
    : pageEntries
  const vStart = rowWindow?.start ?? 0

  const toggleAll = () => {
    if (allPageSelected) {
      const pageIds = new Set(pageEntries.map((entry) => entry.id))
      setSelected(selectedIds.filter((id) => !pageIds.has(id)))
    } else {
      const merged = new Set(selectedIds)
      for (const entry of pageEntries) merged.add(entry.id)
      setSelected([...merged])
    }
  }

  const cols = visibleColumns.value
  const hiddenSet = new Set(columnStateSignal.value.hidden ?? [])
  const showColumnsMenu = columnSettings?.visibility === true
  const activeFilterCount = countActiveFilters(filtersSignal.value)
  const hasFilterRow = cols.some((col) => col.filter !== undefined)
  const colCount =
    cols.length + (selection ? 1 : 0) + (renderExpandedRow ? 1 : 0) + (rowActions ? 1 : 0)
  // "No matching rows" is a different message from "no data": there are rows, the query
  // just excludes them all — and the moment to offer a reset.
  const isNoResults =
    (querySignal.value.trim() !== '' || activeFilterCount > 0) && (server ? true : rows.length > 0)
  const totalRows = server ? (server.totalItems ?? rows.length) : filtered.value.length
  const pageCount = pagination ? Math.max(1, Math.ceil(totalRows / pageSizeSignal.value)) : 1
  const currentPage = Math.min(pageSignal.value, pageCount)
  // Pad partial pages with a spacer row so the table keeps a constant height —
  // the pagination controls stay put as the user pages through.
  const fillerCount =
    pagination && !virtualized && renderedEntries.length > 0
      ? Math.max(0, pageSizeSignal.value - renderedEntries.length)
      : 0
  warnIfUnnamed(title, ariaLabel, columns.map((c) => c.key).join(','))
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  const rangeStart = totalRows === 0 ? 0 : (currentPage - 1) * pageSizeSignal.value + 1
  const rangeEnd = totalRows === 0 ? 0 : rangeStart + pageEntries.length - 1
  const showBatchBar = !!batchActions && batchActions.length > 0 && selectedIds.length > 0

  const renderFilter = (col: Column<Row>): ReactNode => {
    const current = filtersSignal.value[col.key]
    const label = l.filterColumn(col.header)
    switch (col.filter) {
      case 'text':
        return (
          <input
            type="search"
            className={styles['filterInput']}
            aria-label={label}
            value={current?.kind === 'text' ? current.value : ''}
            onChange={(event) =>
              setColumnFilter(col.key, { kind: 'text', value: event.target.value })
            }
          />
        )
      case 'range': {
        const min = current?.kind === 'range' ? current.min : undefined
        const max = current?.kind === 'range' ? current.max : undefined
        const extent = extentOf(col.key)
        const parse = (raw: string) => (raw === '' ? undefined : Number(raw))
        return (
          <div className={styles['rangeInputs']}>
            <input
              type="number"
              className={styles['filterInput']}
              aria-label={`${label}: ${l.min}`}
              placeholder={extent ? String(extent.min) : l.min}
              value={min ?? ''}
              onChange={(event) => {
                const next: ColumnFilterValue = { kind: 'range' }
                const v = parse(event.target.value)
                if (v !== undefined && !Number.isNaN(v)) next.min = v
                if (max !== undefined) next.max = max
                setColumnFilter(col.key, next)
              }}
            />
            <input
              type="number"
              className={styles['filterInput']}
              aria-label={`${label}: ${l.max}`}
              placeholder={extent ? String(extent.max) : l.max}
              value={max ?? ''}
              onChange={(event) => {
                const next: ColumnFilterValue = { kind: 'range' }
                if (min !== undefined) next.min = min
                const v = parse(event.target.value)
                if (v !== undefined && !Number.isNaN(v)) next.max = v
                setColumnFilter(col.key, next)
              }}
            />
          </div>
        )
      }
      case 'select': {
        const selected = current?.kind === 'select' ? current.values : []
        const open = facetOpen.value === col.key
        return (
          <Popover
            placement="bottom"
            open={open}
            onOpenChange={(next) => {
              facetOpen.value = next ? col.key : null
            }}
          >
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary" aria-label={label}>
                {selected.length > 0 ? l.itemsSelected(selected.length) : l.all}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={styles['menu'] as string}>
              {/* Facets are computed on first open, not on mount: one pass over every row. */}
              {open &&
                facetsOf(col.key).map((facet) => {
                  const checked = selected.includes(facet.value)
                  return (
                    <Checkbox
                      key={facet.value}
                      label={`${facet.value === '' ? '—' : facet.value} (${facet.count})`}
                      checked={checked}
                      onChange={() =>
                        setColumnFilter(col.key, {
                          kind: 'select',
                          values: checked
                            ? selected.filter((v) => v !== facet.value)
                            : [...selected, facet.value],
                        })
                      }
                    />
                  )
                })}
            </PopoverContent>
          </Popover>
        )
      }
      default:
        return null
    }
  }

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
      data-fixed-layout={cols.every((col) => col.width !== undefined) || undefined}
    >
      <span aria-live="polite" className={styles['srOnly']}>
        {selectedIds.length > 0 ? l.itemsSelected(selectedIds.length) : ''}
      </span>
      {(title !== undefined ||
        description !== undefined ||
        searchable ||
        toolbar !== undefined ||
        showColumnsMenu ||
        activeFilterCount > 0) && (
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
          <div className={styles['toolbarActions']}>
            {searchable && (
              <input
                type="search"
                className={styles['search']}
                aria-label={l.search}
                placeholder={l.search}
                value={querySignal.value}
                onChange={(event) => {
                  batch(() => {
                    querySignal.value = event.target.value
                    setPage(1)
                  })
                }}
              />
            )}
            {activeFilterCount > 0 && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                {l.clearFilters} ({activeFilterCount})
              </Button>
            )}
            {toolbar}
            {showColumnsMenu && (
              <Popover placement="bottom">
                <PopoverTrigger asChild>
                  <Button size="sm" variant="secondary">
                    {l.columns}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={styles['menu'] as string}>
                  {columns.map((col) => {
                    const shown = !hiddenSet.has(col.key)
                    return (
                      <Checkbox
                        key={col.key}
                        label={col.header}
                        checked={shown}
                        // The last visible column cannot be hidden.
                        disabled={shown && cols.length === 1}
                        onChange={() => toggleColumn(col.key)}
                      />
                    )
                  })}
                </PopoverContent>
              </Popover>
            )}
          </div>
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
        ref={scrollContainerRef}
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
            {cols.map((col) => (
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
            {rowActions && <col className={styles['controlCol']} />}
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
              {cols.map((col) => {
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
              {rowActions && (
                <th scope="col" className={styles['controlCell']}>
                  <span className={styles['srOnly']}>{l.actions}</span>
                </th>
              )}
            </tr>
            {hasFilterRow && (
              <tr className={styles['filterRow']}>
                {renderExpandedRow && <th />}
                {selection && <th />}
                {cols.map((col) => (
                  <th key={col.key} data-align={col.align ?? 'start'}>
                    {col.filter !== undefined && renderFilter(col)}
                  </th>
                ))}
                {rowActions && <th />}
              </tr>
            )}
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
                  {isNoResults ? (noResultsState ?? l.noResults) : (emptyState ?? l.empty)}
                </td>
              </tr>
            )}
            {!loading && rowWindow && rowWindow.topPad > 0 && (
              <tr aria-hidden="true" style={{ height: rowWindow.topPad }} />
            )}
            {!loading &&
              renderedEntries.map((entry, index) => {
                const absoluteIndex = virtualized ? vStart + index : index
                const isSelected = selectedSet.has(entry.id)
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
                      {cols.map((col) => (
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
                      {rowActions && (
                        <td className={styles['controlCell']}>
                          {(() => {
                            const actions = rowActions(entry.row)
                            if (actions.length === 0) return null
                            return (
                              <OverflowMenu
                                size="sm"
                                ariaLabel={l.actions}
                                items={actions.map((action) => ({
                                  id: action.id,
                                  label: action.label,
                                  ...(action.destructive !== undefined && {
                                    destructive: action.destructive,
                                  }),
                                  ...(action.disabled !== undefined && {
                                    disabled: action.disabled,
                                  }),
                                  ...(action.icon !== undefined && { icon: action.icon }),
                                }))}
                                onSelect={(id) =>
                                  actions.find((action) => action.id === id)?.onSelect(entry.row)
                                }
                              />
                            )
                          })()}
                        </td>
                      )}
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
            {!loading && rowWindow && rowWindow.bottomPad > 0 && (
              <tr aria-hidden="true" style={{ height: rowWindow.bottomPad }} />
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
                  batch(() => {
                    pageSizeSignal.value = Number(event.target.value)
                    setPage(1)
                  })
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
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className={styles['pageButton']}
              aria-label={l.nextPage}
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
