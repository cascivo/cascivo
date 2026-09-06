/**
 * Per-column filtering, kept pure so the table's filter pipeline is testable without a DOM
 * and stays O(rows) per change — never per render.
 *
 * Three filter shapes cover what dashboards actually ask for (the same three TanStack's
 * column-filtering guide leads with): a substring on text, a set of allowed values on an
 * enumerated column, and a numeric range. Values arrive from the table's own inputs or from
 * a controlled `filters` prop, so the shape is a plain serialisable object — it round-trips
 * through a URL or storage unchanged.
 */

/** The kind of filter control a column offers. */
export type ColumnFilterKind = 'text' | 'select' | 'range'

/** The current value of one column's filter. An inactive filter is simply absent. */
export type ColumnFilterValue =
  | { kind: 'text'; value: string }
  | { kind: 'select'; values: string[] }
  | { kind: 'range'; min?: number; max?: number }

/** Active filters by column key. */
export type ColumnFilters = Record<string, ColumnFilterValue>

/** Whether a filter value would exclude anything at all. */
export function isFilterActive(filter: ColumnFilterValue | undefined): boolean {
  if (!filter) return false
  switch (filter.kind) {
    case 'text':
      return filter.value.trim() !== ''
    case 'select':
      return filter.values.length > 0
    case 'range':
      return filter.min !== undefined || filter.max !== undefined
  }
}

/** Number of columns with an active filter. */
export function countActiveFilters(filters: ColumnFilters): number {
  let n = 0
  for (const key in filters) if (isFilterActive(filters[key])) n++
  return n
}

/** Does one cell value pass one filter? */
export function matchesFilter(value: unknown, filter: ColumnFilterValue): boolean {
  switch (filter.kind) {
    case 'text': {
      const needle = filter.value.trim().toLowerCase()
      return (
        needle === '' ||
        String(value ?? '')
          .toLowerCase()
          .includes(needle)
      )
    }
    case 'select':
      return filter.values.length === 0 || filter.values.includes(String(value ?? ''))
    case 'range': {
      if (filter.min === undefined && filter.max === undefined) return true
      const n = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(n)) return false
      if (filter.min !== undefined && n < filter.min) return false
      if (filter.max !== undefined && n > filter.max) return false
      return true
    }
  }
}

/**
 * The rows that pass every active filter, in order. Returns `rows` itself when nothing is
 * active, so downstream memos keep their identity.
 */
export function applyColumnFilters<T>(
  rows: readonly T[],
  filters: ColumnFilters,
  valueOf: (row: T, key: string) => unknown,
): readonly T[] {
  const active: Array<[string, ColumnFilterValue]> = []
  for (const key in filters) {
    const f = filters[key]
    if (f && isFilterActive(f)) active.push([key, f])
  }
  if (active.length === 0) return rows
  const out: T[] = []
  for (const row of rows) {
    let pass = true
    for (const [key, f] of active) {
      if (!matchesFilter(valueOf(row, key), f)) {
        pass = false
        break
      }
    }
    if (pass) out.push(row)
  }
  return out
}

/** One facet: a distinct cell value and how many rows carry it. */
export interface Facet {
  value: string
  count: number
}

/**
 * Distinct values of a column with their row counts, most frequent first (ties by
 * collation). This is what a `select` filter offers as its choices — TanStack calls it
 * column faceting. One pass over the rows; the table computes it lazily, on first open.
 */
export function facetValues<T>(rows: readonly T[], valueOf: (row: T) => unknown): Facet[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const v = String(valueOf(row) ?? '')
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const compare = new Intl.Collator().compare
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || compare(a.value, b.value))
}

/** The numeric extent of a column, for a `range` filter's placeholders. `undefined` if no numbers. */
export function numericExtent<T>(
  rows: readonly T[],
  valueOf: (row: T) => unknown,
): { min: number; max: number } | undefined {
  let min = Infinity
  let max = -Infinity
  for (const row of rows) {
    const v = valueOf(row)
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isNaN(n) || v === null || v === undefined || v === '') continue
    if (n < min) min = n
    if (n > max) max = n
  }
  return min <= max ? { min, max } : undefined
}
