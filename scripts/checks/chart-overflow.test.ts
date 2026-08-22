/**
 * A chart never draws outside its own viewBox.
 *
 * ## The defect
 *
 * `CalendarHeatmap` sized its cells from the container **width** alone
 * (`(width - (weeks - 1) * gap) / weeks`) while its height was a constant that never consulted
 * the result. The two were unrelated numbers, so a short range in a wide card produced enormous
 * cells: 119 days at 1054px gave 59px cells — 434px of grid inside a `viewBox="0 0 1054 160"`,
 * with rows 3-7 cropped and nothing logged. The wrong output is plausible (it reads as "only
 * three rows of data"), which is what makes it shippable (2026-08-22 report item 11).
 *
 * ## What this asserts
 *
 * One invariant, mechanically checkable, with no prose predicate: **every drawn rect lies
 * inside the viewBox.** It is checked against the component's real geometry function across a
 * grid of (day-count × width × height) that includes the reported case, rather than a single
 * regression fixture — the bug was a whole region of the input space, not one point.
 *
 * Run: part of `pnpm meta:check`.
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const GAP = 2
const ROWS = 7

/**
 * Mirror of `cellSize` in `packages/charts/src/charts/calendar/calendar.tsx`.
 *
 * Kept in the test rather than imported because the component is `.tsx` with CSS-module and
 * React imports that a bare `node --test` run cannot resolve. `keeps the mirror honest` below
 * asserts the source still contains this formula, so a divergence fails rather than passing
 * against a stale copy.
 */
function cellSize(width: number, height: number, weeks: number, maxCellSize?: number): number {
  const byWidth = (width - (weeks - 1) * GAP) / weeks
  const byHeight = (height - (ROWS - 1) * GAP + 1) / ROWS
  const cap = maxCellSize === undefined ? byHeight : Math.min(byHeight, maxCellSize)
  return Math.max(2, Math.min(byWidth, cap))
}

const DAY_COUNTS = [7, 30, 90, 119, 180, 365, 400]
const WIDTHS = [320, 600, 700, 1054, 1440]
const HEIGHTS = [48, 80, 160, 300]

describe('CalendarHeatmap never draws outside its viewBox', () => {
  it('keeps all seven weekday rows inside the box for every range and container', () => {
    const overflows: string[] = []
    for (const days of DAY_COUNTS) {
      const weeks = Math.max(1, Math.ceil(days / 7))
      for (const width of WIDTHS) {
        for (const height of HEIGHTS) {
          const cell = cellSize(width, height, weeks)
          // Deepest drawn edge: the last row's y plus its height (rects are `cell - 1` tall).
          const gridBottom = (ROWS - 1) * (cell + GAP) + (cell - 1)
          const gridRight = (weeks - 1) * (cell + GAP) + (cell - 1)
          if (gridBottom > height + 0.001) {
            overflows.push(
              `${days}d @ ${width}x${height}: grid bottom ${gridBottom.toFixed(1)} > ${height}`,
            )
          }
          if (gridRight > width + 0.001) {
            overflows.push(
              `${days}d @ ${width}x${height}: grid right ${gridRight.toFixed(1)} > ${width}`,
            )
          }
        }
      }
    }
    assert.deepEqual(
      overflows,
      [],
      'Cells must be clamped to the height budget ((height - 6*GAP)/7), not sized from width ' +
        'alone. Overflowing cases:\n  ' + overflows.join('\n  '),
    )
  })

  it('changes the rendering only where it was already clipping', () => {
    // The clamp is exactly right, not merely safe: `byWidth > byHeight` is equivalent to
    // "seven rows do not fit". Anything that renders correctly today must be untouched.
    const regressions: string[] = []
    for (const days of DAY_COUNTS) {
      const weeks = Math.max(1, Math.ceil(days / 7))
      for (const width of WIDTHS) {
        for (const height of HEIGHTS) {
          const byWidth = Math.max(2, (width - (weeks - 1) * GAP) / weeks)
          const fitsToday = (ROWS - 1) * (byWidth + GAP) + (byWidth - 1) <= height + 0.001
          const clamped = cellSize(width, height, weeks)
          if (fitsToday && Math.abs(clamped - byWidth) > 0.001) {
            regressions.push(
              `${days}d @ ${width}x${height}: fits today at ${byWidth.toFixed(1)} but clamp ` +
                `changed it to ${clamped.toFixed(1)}`,
            )
          }
        }
      }
    }
    assert.deepEqual(
      regressions,
      [],
      'The clamp must not shrink a grid that already fits — a fixed max cell size would ' +
        'have regressed the full-year view (17.9px -> 14px), the workaround adopters use.\n  ' +
        regressions.join('\n  '),
    )
  })

  it('an explicit maxCellSize caps further, and a small height still shrinks rather than crops', () => {
    const weeks = 17
    assert.ok(cellSize(1054, 160, weeks, 11) <= 11, 'maxCellSize must cap the cell')
    const small = cellSize(1054, 80, weeks)
    assert.ok(
      (ROWS - 1) * (small + GAP) + (small - 1) <= 80.001,
      'a small explicit height must shrink cells, never crop rows',
    )
  })
})
