/**
 * Token classes the syntax palette colors. Every kind maps to a
 * `--cascivo-editor-syntax-<kind>` custom property (see @cascivo/tokens). `plain`
 * is uncolored text (whitespace, identifiers a grammar chose not to classify).
 */
export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'type'
  | 'operator'
  | 'punctuation'
  | 'variable'
  | 'tag'
  | 'attr'
  | 'regexp'
  | 'boolean'
  | 'property'
  | 'plain'

/** A single highlighted span. The concatenation of a line's token values is the line. */
export interface Token {
  kind: TokenKind
  value: string
}

/**
 * Opaque per-grammar continuation carried from one line to the next so multi-line
 * constructs (block comments, template literals, fenced code) continue correctly.
 * Each grammar owns the meaning of its own state strings; `'default'` is the start.
 */
export type GrammarState = string

/** Result of tokenizing one line: its spans plus the state to feed the next line. */
export interface LineTokens {
  tokens: Token[]
  state: GrammarState
}

/**
 * A language grammar. Pure and deterministic: `tokenizeLine` must depend only on
 * `(line, state)` and must be lossless (the token values concatenate back to `line`).
 */
export interface Grammar {
  name: string
  initialState: GrammarState
  tokenizeLine(line: string, state: GrammarState): LineTokens
}
