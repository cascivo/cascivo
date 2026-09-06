/**
 * The keyboard model of the APG data-grid pattern, as arithmetic on a cell coordinate.
 *
 * A grid has ONE tab stop; inside it the arrow keys move a focus cell, Home/End jump within
 * the row, Ctrl+Home/End to the corners, PageUp/PageDown by a page of rows. Kept pure so
 * the whole key map is testable without a DOM and so virtualization (the focused row may
 * not be rendered yet) is the table's problem, not this file's.
 */

/** A focus position: `row` is -1 for the header row, otherwise a 0-based body row. */
export interface GridCell {
  row: number
  col: number
}

export interface GridBounds {
  /** Body rows in the collection (not just the rendered window). */
  rowCount: number
  /** Cells per row, control columns included. */
  colCount: number
  /** Rows one PageUp/PageDown moves by. */
  pageRows: number
}

/**
 * The next focus cell for a key, or `undefined` when the key is not a grid-navigation key.
 * Returns the same coordinate at an edge, so the caller can still `preventDefault` without
 * moving.
 */
export function moveGridFocus(
  cell: GridCell,
  key: string,
  bounds: GridBounds,
  ctrl = false,
): GridCell | undefined {
  const lastRow = bounds.rowCount - 1
  const lastCol = bounds.colCount - 1
  const clampRow = (row: number) => Math.max(-1, Math.min(lastRow, row))
  const clampCol = (col: number) => Math.max(0, Math.min(lastCol, col))
  switch (key) {
    case 'ArrowDown':
      return { row: clampRow(cell.row + 1), col: cell.col }
    case 'ArrowUp':
      return { row: clampRow(cell.row - 1), col: cell.col }
    case 'ArrowRight':
      return { row: cell.row, col: clampCol(cell.col + 1) }
    case 'ArrowLeft':
      return { row: cell.row, col: clampCol(cell.col - 1) }
    case 'Home':
      return ctrl ? { row: clampRow(0), col: 0 } : { row: cell.row, col: 0 }
    case 'End':
      return ctrl ? { row: lastRow, col: lastCol } : { row: cell.row, col: lastCol }
    case 'PageDown':
      return { row: clampRow(cell.row + bounds.pageRows), col: cell.col }
    case 'PageUp':
      return { row: clampRow(cell.row - bounds.pageRows), col: cell.col }
    default:
      return undefined
  }
}
