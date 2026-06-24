import { describe, expect, it } from 'vitest'
import '../grammars/builtins.ts'
import { createLineStateIndex } from './line-state.ts'
import { getGrammar } from './registry.ts'
import type { GrammarState } from './types.ts'

/** Oracle: the threaded end-state after each line, via a full-document walk. */
function oracleEndStates(language: string, lines: readonly string[]): GrammarState[] {
  const grammar = getGrammar(language)
  const out: GrammarState[] = []
  let state = grammar.initialState
  for (const line of lines) {
    const { state: next } = grammar.tokenizeLine(line, state)
    out.push(next)
    state = next
  }
  return out
}

const FENCE_DOC = `# heading
prose line
\`\`\`ts
const x = 1
still inside
\`\`\`
after the fence`

describe('LineStateIndex', () => {
  it('startStateOf(0) is the grammar initial state', () => {
    const grammar = getGrammar('markdown')
    const index = createLineStateIndex(grammar)
    expect(index.startStateOf(FENCE_DOC.split('\n'), 0)).toBe(grammar.initialState)
  })

  it('startStateOf(i) equals the oracle end-state of line i-1', () => {
    const lines = FENCE_DOC.split('\n')
    const oracle = oracleEndStates('markdown', lines)
    const index = createLineStateIndex(getGrammar('markdown'))
    for (let i = 1; i <= lines.length; i++) {
      expect(index.startStateOf(lines, i), `start of line ${i}`).toBe(oracle[i - 1])
    }
  })

  it('ensure is lazy and idempotent', () => {
    const lines = FENCE_DOC.split('\n')
    const index = createLineStateIndex(getGrammar('markdown'))
    index.ensure(lines, 2)
    expect(index.length).toBe(3) // only [0, 2] computed
    index.ensure(lines, 1) // smaller upto: no-op
    expect(index.length).toBe(3)
    index.ensure(lines, 2) // equal upto: no-op
    expect(index.length).toBe(3)
    index.ensure(lines, 100) // clamps to lines.length - 1
    expect(index.length).toBe(lines.length)
  })

  it('invalidateFrom truncates and recomputes to match the oracle', () => {
    const lines = FENCE_DOC.split('\n')
    const oracle = oracleEndStates('markdown', lines)
    const index = createLineStateIndex(getGrammar('markdown'))
    index.ensure(lines, lines.length - 1)
    expect(index.length).toBe(lines.length)

    index.invalidateFrom(3) // drop the end-state of line 3 and after
    expect(index.length).toBe(3)

    // Recompute: the restored end-states must match the oracle again.
    index.ensure(lines, lines.length - 1)
    for (let i = 1; i <= lines.length; i++) {
      expect(index.startStateOf(lines, i), `start of line ${i}`).toBe(oracle[i - 1])
    }
  })

  it('invalidateFrom(0) clears the whole index', () => {
    const lines = FENCE_DOC.split('\n')
    const index = createLineStateIndex(getGrammar('markdown'))
    index.ensure(lines, lines.length - 1)
    index.invalidateFrom(0)
    expect(index.length).toBe(0)
  })
})
