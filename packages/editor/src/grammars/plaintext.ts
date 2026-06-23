import { registerGrammar } from '../engine/registry.ts'
import type { Grammar } from '../engine/types.ts'

/** The trivial fallback grammar: one uncolored `plain` token per line. */
export const plaintext: Grammar = {
  name: 'plaintext',
  initialState: 'default',
  tokenizeLine: (line) => ({
    tokens: line.length > 0 ? [{ kind: 'plain', value: line }] : [],
    state: 'default',
  }),
}

registerGrammar(plaintext)
