import { describe, expect, it } from 'vitest'
import { javascript } from '../grammars/javascript.ts'
import { getGrammar } from './registry.ts'
import { tokenize, tokenizeDocument } from './tokenize.ts'

/** Concatenated token values must reconstruct the input exactly (lossless). */
function lossless(line: string, state = 'default'): void {
  const { tokens } = tokenize(getGrammar('javascript'), line, state)
  expect(tokens.map((t) => t.value).join('')).toBe(line)
}

describe('tokenize', () => {
  it('classifies a known line into the expected kinds', () => {
    const { tokens } = tokenize(javascript, 'const x = 1', 'default')
    const kinds = tokens.filter((t) => t.value.trim() !== '').map((t) => [t.kind, t.value])
    expect(kinds).toEqual([
      ['keyword', 'const'],
      ['variable', 'x'],
      ['operator', '='],
      ['number', '1'],
    ])
  })

  it('is lossless including whitespace', () => {
    lossless('  const   foo = "bar"  ')
    lossless('')
    lossless('\t\treturn 42 // done')
  })

  it('returns the continuation state for an unterminated block comment', () => {
    const { endState } = tokenize(javascript, 'before /* open', 'default')
    expect(endState).toBe('block')
  })
})

describe('tokenizeDocument', () => {
  it('returns one token array per line', () => {
    const lines = tokenizeDocument(javascript, 'const a = 1\nlet b = 2\n')
    expect(lines).toHaveLength(3) // trailing newline yields an empty final line
    expect(lines[2]).toEqual([])
  })

  it('carries block-comment state across lines until it closes', () => {
    const lines = tokenizeDocument(javascript, 'a /* one\ntwo\nthree */ b')
    // The middle line is entirely a comment.
    expect(lines[1]!.every((t) => t.kind === 'comment')).toBe(true)
    // The last line closes the comment, then resumes code.
    const last = lines[2]!
    expect(last.some((t) => t.kind === 'comment' && t.value.includes('*/'))).toBe(true)
    expect(last.some((t) => t.kind === 'variable' && t.value === 'b')).toBe(true)
  })

  it('carries template-literal state across lines', () => {
    const lines = tokenizeDocument(javascript, 'const s = `line one\nstill string`')
    expect(lines[1]!.every((t) => t.kind === 'string')).toBe(true)
  })
})
