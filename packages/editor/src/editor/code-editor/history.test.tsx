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
  // Steps are stored as the span they changed, not the document they produced, so
  // undo/redo are reconstructions. Drive a random edit script both ways and require
  // every intermediate text and selection to come back exactly.
  it('reconstructs every state exactly across a random edit script', () => {
    let seed = 12345
    const rand = (n: number) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed % n
    }
    const h = createHistory()
    let text = Array.from({ length: 300 }, (_, i) => `line ${i} of the document`).join('\n')
    const states = [snap(text, 0)]
    h.reset(states[0]!)
    for (let i = 0; i < 120; i++) {
      const at = rand(text.length + 1)
      const len = rand(4) === 0 ? rand(200) : rand(3) // mostly small, sometimes a chunk
      const insert = rand(3) === 0 ? '' : 'INS'.repeat(1 + rand(40))
      text = text.slice(0, at) + insert + text.slice(at + len)
      const s = snap(text, at + insert.length)
      states.push(s)
      h.record(s, { coalesce: rand(2) === 0 })
    }
    // Coalesced runs fold states together, so walk by comparing against the set
    // of recorded texts: every undo/redo result must be one of them, in order.
    const seen: string[] = []
    for (let s = h.undo(); s; s = h.undo()) seen.push(s.text)
    expect(seen.at(-1)).toBe(states[0]!.text)
    for (const t of seen) expect(states.some((s) => s.text === t)).toBe(true)
    const forward: string[] = []
    for (let s = h.redo(); s; s = h.redo()) forward.push(s.text)
    expect(forward.at(-1)).toBe(text)
    expect(forward).toEqual([...seen].reverse().slice(1).concat(text))
  })

  it('folds a coalescing edit into the tip wherever it lands, like a snapshot would', () => {
    // Coalescing is a flag from the caller, not an adjacency check: two single-char
    // edits at different places still fold, matching the previous snapshot behavior.
    const h = createHistory()
    h.reset(snap('abcdef', 0))
    h.record(snap('aXbcdef', 2), { coalesce: true })
    h.record(snap('aXbcdeYf', 7), { coalesce: true })
    expect(h.undo()).toEqual(snap('abcdef', 0))
    expect(h.redo()).toEqual(snap('aXbcdeYf', 7))
  })

  it('restores the selection recorded with each state', () => {
    const h = createHistory()
    h.reset({ text: 'hello', selectionStart: 1, selectionEnd: 3 })
    h.record({ text: 'hXo', selectionStart: 2, selectionEnd: 2 })
    expect(h.undo()).toEqual({ text: 'hello', selectionStart: 1, selectionEnd: 3 })
    expect(h.redo()).toEqual({ text: 'hXo', selectionStart: 2, selectionEnd: 2 })
  })
})
