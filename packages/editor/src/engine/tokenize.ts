import type { Grammar, GrammarState, Token } from './types.ts'

/** Result of tokenizing one line: spans plus the continuation state. */
export interface TokenizeResult {
  tokens: Token[]
  endState: GrammarState
}

/**
 * Tokenize a single line, restartable from `startState`. Pure wrapper over the
 * grammar so the cache layer (T4) and `tokenizeDocument` share one entry point.
 * Inputs `(grammar, line, startState)` fully determine the output.
 */
export function tokenize(grammar: Grammar, line: string, startState: GrammarState): TokenizeResult {
  const { tokens, state } = grammar.tokenizeLine(line, startState)
  return { tokens, endState: state }
}

/**
 * Tokenize a whole document, threading each line's `endState` into the next so
 * block comments / template literals / fenced code continue across lines.
 * Returns one token array per line (including a trailing empty array for a final
 * newline-terminated line).
 */
export function tokenizeDocument(grammar: Grammar, text: string): Token[][] {
  const lines = text.split('\n')
  const out: Token[][] = []
  let state = grammar.initialState
  for (const line of lines) {
    const result = tokenize(grammar, line, state)
    out.push(result.tokens)
    state = result.endState
  }
  return out
}
