/**
 * Column layout as data: which columns show, in what order, how wide, and which stick to
 * an edge. Every transition the header menu and the resize handle perform is a pure
 * function here, so the table never reasons about layout in JSX and each rule is
 * testable on its own.
 *
 * The shape is deliberately a plain object of keys (`ColumnState`): it round-trips through
 * storage or a URL, and it survives the column definitions changing underneath it — a key
 * that no longer exists is ignored, a new column simply takes its definition position.
 */

/** Which edge a pinned column sticks to. */
export type PinSide = 'start' | 'end'

/** User-adjustable column layout. All fields optional; an absent field means "as defined". */
export interface ColumnState {
  /** Keys of hidden columns. At least one column always stays visible. */
  hidden?: string[]
  /** Display order of column keys; keys not listed follow in definition order. */
  order?: string[]
  /** Explicit widths in px, by key — what the resize handle writes. */
  widths?: Record<string, number>
  /** Pinned columns by key. Pinned-start columns render first, pinned-end last. */
  pinned?: Record<string, PinSide>
}

/** The smallest a column can be dragged to. */
export const MIN_COLUMN_WIDTH = 48

interface Keyed {
  key: string
}

/** All columns in display order — `order` first, unlisted after in definition order. */
export function orderedColumns<C extends Keyed>(columns: readonly C[], state: ColumnState): C[] {
  const order = state.order
  if (!order || order.length === 0) return [...columns]
  const byKey = new Map(columns.map((col) => [col.key, col]))
  const out: C[] = []
  for (const key of order) {
    const col = byKey.get(key)
    if (col) {
      out.push(col)
      byKey.delete(key)
    }
  }
  for (const col of columns) if (byKey.has(col.key)) out.push(col)
  return out
}

/**
 * The columns to render, in render order: pinned-start, then unpinned, then pinned-end,
 * each group in display order, hidden columns removed. Never empty — if the state hides
 * everything, the definitions win, so a stale persisted state cannot blank the table.
 */
export function displayColumns<C extends Keyed>(columns: readonly C[], state: ColumnState): C[] {
  const hidden = new Set(state.hidden ?? [])
  const pinned = state.pinned ?? {}
  const ordered = orderedColumns(columns, state).filter((col) => !hidden.has(col.key))
  if (ordered.length === 0) return [...columns]
  const start = ordered.filter((col) => pinned[col.key] === 'start')
  const middle = ordered.filter((col) => pinned[col.key] === undefined)
  const end = ordered.filter((col) => pinned[col.key] === 'end')
  return [...start, ...middle, ...end]
}

/**
 * Move `key` one step left or right among the visible columns of its own pin group. The
 * result is a complete `order` (every column key), so the move is stable under later
 * changes. Returns the same state when the column is already at the edge of its group.
 */
export function moveColumn<C extends Keyed>(
  columns: readonly C[],
  state: ColumnState,
  key: string,
  direction: -1 | 1,
): ColumnState {
  const hidden = new Set(state.hidden ?? [])
  const pinned = state.pinned ?? {}
  const all = orderedColumns(columns, state).map((col) => col.key)
  const from = all.indexOf(key)
  if (from === -1) return state
  const side = pinned[key]
  // The neighbour is the next visible column on the same side; hidden ones are skipped
  // over and other pin groups are never crossed.
  let to = from + direction
  while (to >= 0 && to < all.length) {
    const candidate = all[to] as string
    if (!hidden.has(candidate) && pinned[candidate] === side) break
    if (pinned[candidate] !== side) return state
    to += direction
  }
  if (to < 0 || to >= all.length) return state
  const next = [...all]
  next.splice(from, 1)
  next.splice(to, 0, key)
  return { ...state, order: next }
}

/** Pin `key` to a side, or unpin it with `null`. */
export function pinColumn(state: ColumnState, key: string, side: PinSide | null): ColumnState {
  const pinned = { ...state.pinned }
  if (side === null) delete pinned[key]
  else pinned[key] = side
  return { ...state, pinned }
}

/** Set an explicit width for `key`, or clear it with `undefined` to return to auto. */
export function resizeColumn(
  state: ColumnState,
  key: string,
  width: number | undefined,
): ColumnState {
  const widths = { ...state.widths }
  if (width === undefined) delete widths[key]
  else widths[key] = Math.max(MIN_COLUMN_WIDTH, Math.round(width))
  return { ...state, widths }
}

/** Hide or show `key`. Hiding the last visible column is refused. */
export function toggleColumnHidden<C extends Keyed>(
  columns: readonly C[],
  state: ColumnState,
  key: string,
): ColumnState {
  const hidden = state.hidden ?? []
  if (hidden.includes(key)) return { ...state, hidden: hidden.filter((k) => k !== key) }
  const visible = columns.filter((col) => !hidden.includes(col.key))
  if (visible.length <= 1) return state
  return { ...state, hidden: [...hidden, key] }
}

/**
 * Sticky insets for a row of cells, given each cell's measured width and which side (if
 * any) it is pinned to. A pinned-start cell sits after every pinned-start cell before it;
 * a pinned-end cell before every pinned-end cell after it. Unpinned cells get `undefined`.
 */
export function stickyOffsets(
  widths: readonly number[],
  sides: readonly (PinSide | undefined)[],
): (number | undefined)[] {
  const out: (number | undefined)[] = Array.from({ length: widths.length })
  let acc = 0
  for (let i = 0; i < widths.length; i++) {
    if (sides[i] === 'start') {
      out[i] = acc
      acc += widths[i] as number
    }
  }
  acc = 0
  for (let i = widths.length - 1; i >= 0; i--) {
    if (sides[i] === 'end') {
      out[i] = acc
      acc += widths[i] as number
    }
  }
  return out
}
