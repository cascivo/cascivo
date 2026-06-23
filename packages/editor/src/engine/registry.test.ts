import { describe, expect, it } from 'vitest'
import '../grammars/typescript.ts'
import type { Grammar } from './types.ts'
import { getGrammar, listGrammars, registerGrammar } from './registry.ts'

describe('registry', () => {
  it('resolves a registered grammar by name', () => {
    expect(getGrammar('typescript').name).toBe('typescript')
  })

  it('falls back to plaintext for an unknown language', () => {
    expect(getGrammar('does-not-exist').name).toBe('plaintext')
    expect(getGrammar(undefined).name).toBe('plaintext')
  })

  it('registers a custom grammar', () => {
    const custom: Grammar = {
      name: 'custom-lang',
      initialState: 'default',
      tokenizeLine: (line) => ({ tokens: [{ kind: 'plain', value: line }], state: 'default' }),
    }
    registerGrammar(custom)
    expect(getGrammar('custom-lang')).toBe(custom)
    expect(listGrammars()).toContain('custom-lang')
  })
})
