import { describe, expect, it } from 'vitest'
import { computeWindow, MAX_CANVAS_PX, scrollTopForRow } from './virtual-window'

const base = { viewportHeight: 600, rowHeight: 49, overscan: 3 }

describe('computeWindow', () => {
  it('is the plain spacer layout below the canvas cap', () => {
    const w = computeWindow({ ...base, scrollTop: 49 * 100, count: 1000 })
    expect(w.scale).toBe(1)
    expect(w.canvasHeight).toBe(49 * 1000)
    expect(w.start).toBe(97) // 100 - overscan
    expect(w.topPad).toBe(97 * 49)
    // 600 / 49 = 12.2 visible → 13 rows + 1, plus overscan below
    expect(w.end).toBe(100 + 14 + 3)
    expect(w.topPad + (w.end - w.start) * 49 + w.bottomPad).toBe(w.canvasHeight)
  })

  it('renders from the top with no top spacer at scrollTop 0', () => {
    const w = computeWindow({ ...base, scrollTop: 0, count: 1000 })
    expect(w.start).toBe(0)
    expect(w.topPad).toBe(0)
  })

  it('handles an empty collection', () => {
    expect(computeWindow({ ...base, scrollTop: 0, count: 0 })).toEqual({
      start: 0,
      end: 0,
      topPad: 0,
      bottomPad: 0,
      canvasHeight: 0,
      scale: 1,
    })
  })

  it('clamps a scroll position past the end', () => {
    const w = computeWindow({ ...base, scrollTop: 10 ** 9, count: 1000 })
    expect(w.end).toBe(1000)
    expect(w.topPad + (w.end - w.start) * 49 + w.bottomPad).toBe(w.canvasHeight)
  })

  describe('above the canvas cap', () => {
    // A million 49 px rows is 49,000,000 px — past every browser's element-height clamp.
    const count = 1_000_000
    const big = { ...base, count }

    it('caps the canvas and scales the scroll position onto the row space', () => {
      const w = computeWindow({ ...big, scrollTop: 0 })
      expect(w.canvasHeight).toBe(MAX_CANVAS_PX)
      expect(w.scale).toBeGreaterThan(1)
      expect(w.start).toBe(0)
    })

    it('reaches the very last row at the bottom of the scrollbar', () => {
      const w = computeWindow({ ...big, scrollTop: MAX_CANVAS_PX - 600 })
      expect(w.end).toBe(count)
      // The last row's bottom edge lands exactly on the canvas bottom, i.e. it is on screen.
      expect(w.topPad + (w.end - w.start) * 49).toBe(MAX_CANVAS_PX)
      expect(w.bottomPad).toBe(0)
    })

    it('puts the middle of the scrollbar at the middle of the collection', () => {
      const w = computeWindow({ ...big, scrollTop: (MAX_CANVAS_PX - 600) / 2 })
      // Half-way down the scrollable range is half-way down the scrollable content —
      // the row at (contentHeight − viewport) / 2, as in an uncapped layout.
      const expectedFirstVisible = Math.floor((count * 49 - 600) / 2 / 49)
      expect(w.start + 3).toBe(expectedFirstVisible)
      expect(w.end).toBeGreaterThan(expectedFirstVisible + 12)
    })

    it('keeps the rendered rows under the viewport at every scroll position', () => {
      // At any scrollTop the window must cover [scrollTop, scrollTop + viewport] with
      // spacers that sum to the capped canvas — otherwise the viewport shows blank canvas.
      for (let i = 0; i <= 200; i++) {
        const scrollTop = Math.floor(((MAX_CANVAS_PX - 600) * i) / 200)
        const w = computeWindow({ ...big, scrollTop })
        const rowsTop = w.topPad
        const rowsBottom = w.topPad + (w.end - w.start) * 49
        expect(rowsTop, `top at ${scrollTop}`).toBeLessThanOrEqual(scrollTop)
        expect(rowsBottom, `bottom at ${scrollTop}`).toBeGreaterThanOrEqual(scrollTop + 600)
        expect(w.topPad + (w.end - w.start) * 49 + w.bottomPad).toBe(MAX_CANVAS_PX)
        expect(w.end - w.start).toBeLessThanOrEqual(14 + 3 * 2)
      }
    })

    it('is monotonic: scrolling down never moves the window up', () => {
      let prev = -1
      for (let i = 0; i <= 500; i++) {
        const w = computeWindow({
          ...big,
          scrollTop: Math.floor(((MAX_CANVAS_PX - 600) * i) / 500),
        })
        expect(w.start).toBeGreaterThanOrEqual(prev)
        prev = w.start
      }
    })
  })
  describe('scrollTopForRow', () => {
    it('lands the row inside the window it produces, below and above the cap', () => {
      for (const count of [1000, 1_000_000]) {
        for (const row of [0, 1, 500, count - 1, Math.floor(count / 2)]) {
          const input = { viewportHeight: 600, rowHeight: 49, count, overscan: 3 }
          const scrollTop = scrollTopForRow(row, input)
          const w = computeWindow({ ...input, scrollTop })
          expect(w.start, `row ${row} of ${count}`).toBeLessThanOrEqual(row)
          expect(w.end, `row ${row} of ${count}`).toBeGreaterThan(row)
        }
      }
    })
    it('is zero when everything fits', () => {
      expect(
        scrollTopForRow(3, { viewportHeight: 600, rowHeight: 49, count: 5, overscan: 3 }),
      ).toBe(0)
    })
  })
})
