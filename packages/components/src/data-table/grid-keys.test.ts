import { describe, expect, it } from 'vitest'
import { moveGridFocus } from './grid-keys'

const bounds = { rowCount: 100, colCount: 4, pageRows: 10 }

describe('moveGridFocus', () => {
  it('moves by one cell with the arrows and clamps at the edges', () => {
    expect(moveGridFocus({ row: 5, col: 1 }, 'ArrowDown', bounds)).toEqual({ row: 6, col: 1 })
    expect(moveGridFocus({ row: 5, col: 1 }, 'ArrowUp', bounds)).toEqual({ row: 4, col: 1 })
    expect(moveGridFocus({ row: 5, col: 1 }, 'ArrowRight', bounds)).toEqual({ row: 5, col: 2 })
    expect(moveGridFocus({ row: 5, col: 0 }, 'ArrowLeft', bounds)).toEqual({ row: 5, col: 0 })
    expect(moveGridFocus({ row: 99, col: 3 }, 'ArrowDown', bounds)).toEqual({ row: 99, col: 3 })
    expect(moveGridFocus({ row: 99, col: 3 }, 'ArrowRight', bounds)).toEqual({ row: 99, col: 3 })
  })

  it('treats the header as row -1 and never goes above it', () => {
    expect(moveGridFocus({ row: 0, col: 2 }, 'ArrowUp', bounds)).toEqual({ row: -1, col: 2 })
    expect(moveGridFocus({ row: -1, col: 2 }, 'ArrowUp', bounds)).toEqual({ row: -1, col: 2 })
    expect(moveGridFocus({ row: -1, col: 2 }, 'ArrowDown', bounds)).toEqual({ row: 0, col: 2 })
  })

  it('jumps within the row on Home/End and to the corners with Ctrl', () => {
    expect(moveGridFocus({ row: 7, col: 2 }, 'Home', bounds)).toEqual({ row: 7, col: 0 })
    expect(moveGridFocus({ row: 7, col: 2 }, 'End', bounds)).toEqual({ row: 7, col: 3 })
    expect(moveGridFocus({ row: 7, col: 2 }, 'Home', bounds, true)).toEqual({ row: 0, col: 0 })
    expect(moveGridFocus({ row: 7, col: 2 }, 'End', bounds, true)).toEqual({ row: 99, col: 3 })
  })

  it('pages by pageRows and clamps', () => {
    expect(moveGridFocus({ row: 7, col: 2 }, 'PageDown', bounds)).toEqual({ row: 17, col: 2 })
    expect(moveGridFocus({ row: 95, col: 2 }, 'PageDown', bounds)).toEqual({ row: 99, col: 2 })
    expect(moveGridFocus({ row: 3, col: 2 }, 'PageUp', bounds)).toEqual({ row: -1, col: 2 })
  })

  it('returns undefined for keys it does not own', () => {
    expect(moveGridFocus({ row: 1, col: 1 }, 'Enter', bounds)).toBeUndefined()
    expect(moveGridFocus({ row: 1, col: 1 }, 'a', bounds)).toBeUndefined()
  })

  it('handles an empty body', () => {
    const empty = { rowCount: 0, colCount: 2, pageRows: 5 }
    expect(moveGridFocus({ row: -1, col: 0 }, 'ArrowDown', empty)).toEqual({ row: -1, col: 0 })
    expect(moveGridFocus({ row: -1, col: 0 }, 'End', empty, true)).toEqual({ row: -1, col: 1 })
  })
})
