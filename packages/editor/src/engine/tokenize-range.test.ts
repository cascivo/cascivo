import { describe, expect, it } from 'vitest'
import '../grammars/builtins.ts'
import { createLineStateIndex } from './line-state.ts'
import { getGrammar } from './registry.ts'
import { tokenizeDocument, tokenizeRange } from './tokenize.ts'

// Adversarial documents: the cross-line state cases where a windowed tokenizer
// can silently corrupt highlighting if it starts a window in the wrong state.
const UNCLOSED_FENCE = `# heading
text before

\`\`\`ts
const x = 1
// this fence never closes
more code
and more`

const NESTED_ADJACENT_FENCES = `intro line
\`\`\`ts
const a = 1
\`\`\`
between the blocks
\`\`\`bash
echo hi
\`\`\`
\`\`\`json
{ "k": 1 }
\`\`\`
outro`

const BLOCK_COMMENT_CROSSING = `const a = 1
/* this block comment
   spans several
   lines before
   it finally */ closes
const b = 2`

const FIXTURES: Array<{ name: string; language: string; text: string }> = [
  { name: 'unclosed markdown fence', language: 'markdown', text: UNCLOSED_FENCE },
  { name: 'nested/adjacent fences', language: 'markdown', text: NESTED_ADJACENT_FENCES },
  { name: 'block comment crossing boundary', language: 'typescript', text: BLOCK_COMMENT_CROSSING },
]

describe('tokenizeRange equals the tokenizeDocument oracle', () => {
  for (const { name, language, text } of FIXTURES) {
    it(`matches the oracle slice for every [from, to) — ${name}`, () => {
      const grammar = getGrammar(language)
      const lines = text.split('\n')
      const oracle = tokenizeDocument(grammar, text)
      // Sweep all start lines (including mid-fence) and ends (including past EOF).
      for (let from = 0; from <= lines.length; from++) {
        for (let to = from; to <= lines.length + 2; to++) {
          const index = createLineStateIndex(grammar) // fresh index per case
          const range = tokenizeRange(grammar, lines, from, to, index)
          expect(range, `[${from}, ${to})`).toEqual(oracle.slice(from, to))
        }
      }
    })
  }

  it('stays consistent across overlapping windows sharing one index', () => {
    const grammar = getGrammar('markdown')
    const text = NESTED_ADJACENT_FENCES
    const lines = text.split('\n')
    const oracle = tokenizeDocument(grammar, text)
    const index = createLineStateIndex(grammar)
    // Overlapping windows, out of order, against the SAME index.
    const windows: Array<[number, number]> = [
      [4, 8],
      [0, 5],
      [6, lines.length],
      [2, 9],
      [0, lines.length],
    ]
    for (const [from, to] of windows) {
      const range = tokenizeRange(grammar, lines, from, to, index)
      expect(range, `window [${from}, ${to})`).toEqual(oracle.slice(from, to))
    }
  })

  it('returns an empty range for an empty or out-of-bounds window', () => {
    const grammar = getGrammar('markdown')
    const lines = UNCLOSED_FENCE.split('\n')
    const index = createLineStateIndex(grammar)
    expect(tokenizeRange(grammar, lines, 3, 3, index)).toEqual([])
    expect(tokenizeRange(grammar, lines, 999, 1005, index)).toEqual([])
  })
})
