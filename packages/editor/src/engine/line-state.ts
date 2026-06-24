import { tokenize } from './tokenize.ts'
import type { Grammar, GrammarState } from './types.ts'

/**
 * A persistent, mutable index of per-line grammar **end-states** — the state
 * carried *after* each line, which is exactly the start-state of the next line.
 * It lets a windowed tokenizer obtain the start-state of any visible line as a
 * read (or a lazy compute) instead of re-walking the whole document from line 0
 * on every render.
 *
 * `endStates[i]` is the state after line `i`; the start-state of line `i` is
 * therefore `endStates[i-1]` (line 0 starts at `grammar.initialState`). The array
 * is always a contiguous prefix `[0, length-1]` — methods never leave gaps.
 *
 * Framework-free: pure data + methods, no React, no signals. The component holds
 * one in a `useRef` as mutable infrastructure (like the undo/redo history handle).
 */
export interface LineStateIndex {
  /** The grammar this index threads state for. */
  readonly grammar: Grammar
  /** Count of known end-states (always a contiguous prefix from line 0). */
  readonly length: number
  /** Lazily compute + memoize end-states up to (and including) line `upto`. */
  ensure(lines: readonly string[], upto: number): void
  /** The threaded start-state for line `i` (ensures the prefix as a side effect). */
  startStateOf(lines: readonly string[], i: number): GrammarState
  /** Record the end-state of line `i` (append at the prefix end, or overwrite). */
  setEndState(i: number, state: GrammarState): void
  /** Drop the end-state of `line` and everything after it (called on an edit). */
  invalidateFrom(line: number): void
}

/** Create an empty {@link LineStateIndex} for `grammar`. */
export function createLineStateIndex(grammar: Grammar): LineStateIndex {
  const endStates: GrammarState[] = []

  const ensure = (lines: readonly string[], upto: number): void => {
    const target = Math.min(upto, lines.length - 1)
    let i = endStates.length
    if (i > target) return
    let state = i === 0 ? grammar.initialState : (endStates[i - 1] as GrammarState)
    for (; i <= target; i++) {
      const result = tokenize(grammar, lines[i] as string, state)
      endStates[i] = result.endState
      state = result.endState
    }
  }

  const startStateOf = (lines: readonly string[], i: number): GrammarState => {
    if (i <= 0) return grammar.initialState
    ensure(lines, i - 1)
    return endStates[i - 1] as GrammarState
  }

  const setEndState = (i: number, state: GrammarState): void => {
    endStates[i] = state
  }

  const invalidateFrom = (line: number): void => {
    const at = Math.max(0, line)
    if (at < endStates.length) endStates.length = at
  }

  return {
    grammar,
    get length() {
      return endStates.length
    },
    ensure,
    startStateOf,
    setEndState,
    invalidateFrom,
  }
}
