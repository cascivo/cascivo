/** Squarified treemap layout algorithm. */

export interface TreemapNode {
  id: string
  value: number
}

export interface TreemapRect {
  id: string
  x: number
  y: number
  w: number
  h: number
}

function worst(row: number[], w: number, s: number): number {
  const rMax = Math.max(...row)
  const rMin = Math.min(...row)
  return Math.max((w * w * rMax) / (s * s), (s * s) / (w * w * rMin))
}

function layoutRow(
  row: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  ids: string[],
  rects: TreemapRect[],
): void {
  const rowSum = row.reduce((a, b) => a + b, 0)
  let cx = x
  let cy = y
  for (let i = 0; i < row.length; i++) {
    const v = row[i] ?? 0
    const id = ids[i] ?? ''
    if (w >= h) {
      const rw = (rowSum > 0 ? v / rowSum : 0) * w
      rects.push({ id, x: cx, y: cy, w: rw, h })
      cx += rw
    } else {
      const rh = (rowSum > 0 ? v / rowSum : 0) * h
      rects.push({ id, x: cx, y: cy, w, h: rh })
      cy += rh
    }
  }
}

function squarifyRecurse(
  nodes: { id: string; value: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
  rects: TreemapRect[],
): void {
  if (nodes.length === 0 || w <= 0 || h <= 0) return

  const total = nodes.reduce((s, n) => s + n.value, 0)
  if (total === 0) return

  // Normalize values to fill the rectangle area
  const area = w * h
  const values = nodes.map((n) => (n.value / total) * area)
  const ids = nodes.map((n) => n.id)

  let row: number[] = []
  let rowIds: string[] = []
  const shorter = Math.min(w, h)
  let rowSum = 0

  let i = 0
  while (i < values.length) {
    const v = values[i] ?? 0
    const id = ids[i] ?? ''
    const newRow = [...row, v]
    const newRowSum = rowSum + v
    if (row.length === 0 || worst(newRow, shorter, newRowSum) <= worst(row, shorter, rowSum)) {
      row = newRow
      rowIds = [...rowIds, id]
      rowSum = newRowSum
      i++
    } else {
      // Lay out current row
      const rowFraction = rowSum / area
      if (w >= h) {
        const rowW = rowFraction * w
        layoutRow(row, x, y, rowW, h, rowIds, rects)
        squarifyRecurse(nodes.slice(i), x + rowW, y, w - rowW, h, rects)
      } else {
        const rowH = rowFraction * h
        layoutRow(row, x, y, w, rowH, rowIds, rects)
        squarifyRecurse(nodes.slice(i), x, y + rowH, w, h - rowH, rects)
      }
      return
    }
  }

  // Lay out remaining row
  if (row.length > 0) {
    const rowFraction = rowSum / area
    if (w >= h) {
      layoutRow(row, x, y, rowFraction * w, h, rowIds, rects)
    } else {
      layoutRow(row, x, y, w, rowFraction * h, rowIds, rects)
    }
  }
}

/**
 * Squarified treemap algorithm (~60 lines).
 * Returns rectangles positioned within [0, width] × [0, height].
 */
export function squarify(nodes: TreemapNode[], width: number, height: number): TreemapRect[] {
  if (nodes.length === 0 || width <= 0 || height <= 0) return []
  const sorted = [...nodes].sort((a, b) => b.value - a.value)
  const rects: TreemapRect[] = []
  squarifyRecurse(sorted, 0, 0, width, height, rects)
  return rects
}
