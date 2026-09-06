/**
 * Row grouping, aggregation and column-group spans as data. The table's body is a flat
 * list either way — grouping just interleaves group rows with the leaf rows they own, so
 * paging, the virtual window and the grid keyboard model need no notion of a tree.
 */

/** Built-in aggregations for `Column.aggregate`. */
export type AggregateKind = 'sum' | 'avg' | 'min' | 'max' | 'count'

/** A band of columns under one header (`columnGroups`). */
export interface ColumnGroup {
  header: string
  /** Column keys in the band. Non-adjacent keys render as separate spans. */
  columns: string[]
}

export interface GroupInfo {
  /** Stable identity: the path of `column=value` pairs down to this group. */
  key: string
  /** The column this level groups on. */
  column: string
  value: unknown
  depth: number
  /** Leaf rows under the group, at every depth. */
  count: number
  collapsed: boolean
}

/** A group row in the flattened list; `leaves` are the rows it owns. */
export interface GroupItem<T> {
  id: string
  group: GroupInfo
  leaves: readonly T[]
}

// A unit separator: no cell value contains one, so a path cannot be forged by a value.
const PATH_SEPARATOR = '\u001f'

/**
 * Interleave group rows with `items`, one level per key, keeping the items' order inside
 * each group (so a sorted input stays sorted) and the groups in order of first
 * appearance. Leaves under a collapsed group are omitted; the group row stays.
 */
export function groupItems<T extends { id: string }>(
  items: readonly T[],
  keys: readonly string[],
  valueOf: (item: T, key: string) => unknown,
  collapsed: ReadonlySet<string>,
): (T | GroupItem<T>)[] {
  const out: (T | GroupItem<T>)[] = []
  const walk = (rows: readonly T[], depth: number, prefix: string) => {
    const column = keys[depth]
    if (column === undefined) {
      for (const row of rows) out.push(row)
      return
    }
    const buckets = new Map<string, { value: unknown; rows: T[] }>()
    for (const row of rows) {
      const value = valueOf(row, column)
      const label = String(value ?? '')
      const bucket = buckets.get(label)
      if (bucket) bucket.rows.push(row)
      else buckets.set(label, { value, rows: [row] })
    }
    for (const [label, bucket] of buckets) {
      const key = `${prefix}${column}=${label}`
      const isCollapsed = collapsed.has(key)
      out.push({
        id: `group${PATH_SEPARATOR}${key}`,
        group: {
          key,
          column,
          value: bucket.value,
          depth,
          count: bucket.rows.length,
          collapsed: isCollapsed,
        },
        leaves: bucket.rows,
      })
      if (!isCollapsed) walk(bucket.rows, depth + 1, `${key}${PATH_SEPARATOR}`)
    }
  }
  walk(items, 0, '')
  return out
}

/**
 * One number for a column over a set of rows. Non-numeric, blank and null values are
 * skipped (a `count` counts rows, not numbers); `undefined` when nothing was numeric.
 */
export function aggregate(values: readonly unknown[], kind: AggregateKind): number | undefined {
  if (kind === 'count') return values.length
  let sum = 0
  let n = 0
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const x = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(x)) continue
    n++
    sum += x
    if (x < min) min = x
    if (x > max) max = x
  }
  if (n === 0) return undefined
  switch (kind) {
    case 'sum':
      return sum
    case 'avg':
      return sum / n
    case 'min':
      return min
    default:
      return max
  }
}

/**
 * The header cells of the column-group row, for the visible columns in render order: a
 * run of adjacent columns in the same group becomes one spanning cell; columns in no
 * group (or split from their group by reordering) get an unlabelled span.
 */
export function headerSpans(
  columnKeys: readonly string[],
  groups: readonly ColumnGroup[],
): { header: string | undefined; span: number }[] {
  const groupOf = new Map<string, string>()
  for (const group of groups) for (const key of group.columns) groupOf.set(key, group.header)
  const out: { header: string | undefined; span: number }[] = []
  for (const key of columnKeys) {
    const header = groupOf.get(key)
    const last = out[out.length - 1]
    if (last && last.header === header) last.span++
    else out.push({ header, span: 1 })
  }
  return out
}
