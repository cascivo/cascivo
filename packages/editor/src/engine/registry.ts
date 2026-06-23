import type { Grammar } from './types.ts'

/**
 * Module-level grammar registry. Grammars self-register when their module is
 * imported (tree-shakeable: a consumer who never imports a grammar never pays
 * for it). `plaintext` is always available as the fallback.
 */
const registry = new Map<string, Grammar>()

/** The hard fallback — registered eagerly so `getGrammar` always resolves. */
const PLAINTEXT: Grammar = {
  name: 'plaintext',
  initialState: 'default',
  tokenizeLine: (line) => ({
    tokens: line.length > 0 ? [{ kind: 'plain', value: line }] : [],
    state: 'default',
  }),
}
registry.set(PLAINTEXT.name, PLAINTEXT)

/** Register (or replace) a grammar under its `name`. */
export function registerGrammar(grammar: Grammar): void {
  registry.set(grammar.name, grammar)
}

/** Resolve a grammar by name, falling back to `plaintext` for unknown languages. */
export function getGrammar(name?: string): Grammar {
  if (name !== undefined) {
    const found = registry.get(name)
    if (found) return found
  }
  return registry.get('plaintext') as Grammar
}

/** List the names of all currently-registered grammars. */
export function listGrammars(): string[] {
  return [...registry.keys()]
}
