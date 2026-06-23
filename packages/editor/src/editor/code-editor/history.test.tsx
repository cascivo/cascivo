import { describe, expect, it } from 'vitest'
import { createHistory } from './history.ts'

const snap = (text: string, at = text.length) => ({ text, selectionStart: at, selectionEnd: at })

describe('createHistory', () => {
  it('undo restores the previous text and selection; redo re-applies', () => {
    const h = createHistory()
    h.reset(snap(''))
    h.record(snap('a'))
    h.record(snap('ab'))
    expect(h.undo()).toEqual(snap('a'))
    expect(h.undo()).toEqual(snap(''))
    expect(h.undo()).toBeUndefined() // at the start
    expect(h.redo()).toEqual(snap('a'))
    expect(h.redo()).toEqual(snap('ab'))
    expect(h.redo()).toBeUndefined() // at the tip
  })

  it('a new record after undo truncates the redo tail', () => {
    const h = createHistory()
    h.reset(snap(''))
    h.record(snap('a'))
    h.record(snap('ab'))
    h.undo() // back to 'a'
    h.record(snap('aZ'))
    expect(h.canRedo()).toBe(false)
    expect(h.undo()).toEqual(snap('a'))
  })

  it('coalesces a run of single-character typing into one undo step', () => {
    const h = createHistory()
    h.reset(snap(''))
    h.record(snap('a'), { coalesce: true })
    h.record(snap('ab'), { coalesce: true })
    h.record(snap('abc'), { coalesce: true })
    // One undo reverts the whole run back to the pre-typing state.
    expect(h.undo()).toEqual(snap(''))
  })

  it('does not coalesce across a non-coalescing edit', () => {
    const h = createHistory()
    h.reset(snap(''))
    h.record(snap('a'), { coalesce: true })
    h.record(snap('a paste'), { coalesce: false })
    h.record(snap('a paste!'), { coalesce: true })
    expect(h.undo()).toEqual(snap('a paste'))
    expect(h.undo()).toEqual(snap('a'))
  })

  it('bounds the stack to capacity, dropping the oldest', () => {
    const h = createHistory(3)
    h.reset(snap('0'))
    h.record(snap('1'))
    h.record(snap('2'))
    h.record(snap('3')) // drops '0'
    expect(h.undo()).toEqual(snap('2'))
    expect(h.undo()).toEqual(snap('1'))
    expect(h.undo()).toBeUndefined() // '0' was evicted
  })
})
