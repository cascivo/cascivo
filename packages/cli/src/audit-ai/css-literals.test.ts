import { describe, expect, it } from 'vitest'
import type { Contract } from '../utils/contract.js'
import { buildContract } from '../utils/contract.js'
import { findCssLiteralViolations } from './css-literals.js'

const contract: Contract = buildContract({
  catalog: {
    tokens: [
      { name: '--cascade-color-accent', resolvedDefault: '#3b82f6' },
      { name: '--cascade-color-primary', resolvedDefault: '#ff0000' },
      { name: '--cascade-color-brand', resolvedDefault: '#ff0000' },
      { name: '--cascade-space-2', resolvedDefault: '8px' },
    ],
  },
  registry: { components: [] },
  context: { components: [] },
})

describe('findCssLiteralViolations', () => {
  it('errors on an exact single-token hex match in CSS', () => {
    const out = findCssLiteralViolations('a { color: #3b82f6; }', 'a.css', contract)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      level: 'error',
      property: 'color',
      value: '#3b82f6',
      rule: 'hardcoded-value',
      suggestedToken: '--cascade-color-accent',
    })
  })

  it('emits info when a value matches multiple tokens', () => {
    const out = findCssLiteralViolations('a { color: #ff0000; }', 'a.css', contract)
    expect(out).toHaveLength(1)
    expect(out[0].level).toBe('info')
    expect(out[0].allMatches).toEqual(['--cascade-color-primary', '--cascade-color-brand'])
    expect(out[0].suggestedToken).toBeUndefined()
  })

  it('does not flag a literal with no catalog match', () => {
    expect(findCssLiteralViolations('a { font-size: 13px; }', 'a.css', contract)).toEqual([])
    expect(findCssLiteralViolations('a { color: #abcdef; }', 'a.css', contract)).toEqual([])
  })

  it('does not flag var(--cascade-*) values', () => {
    const css = 'a { color: var(--cascade-color-accent); }'
    expect(findCssLiteralViolations(css, 'a.css', contract)).toEqual([])
  })

  it('ignores non-visual properties', () => {
    expect(findCssLiteralViolations('a { z-index: 8px; }', 'a.css', contract)).toEqual([])
  })

  it('flags inline TSX style literals', () => {
    const tsx = `<div style={{ color: '#3b82f6' }} />`
    const out = findCssLiteralViolations(tsx, 'C.tsx', contract)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      property: 'color',
      suggestedToken: '--cascade-color-accent',
      line: 1,
    })
  })

  it('reports the correct line number', () => {
    const css = 'a {\n  color: red;\n  background-color: #3b82f6;\n}'
    const out = findCssLiteralViolations(css, 'a.css', contract)
    expect(out).toHaveLength(1)
    expect(out[0].line).toBe(3)
    expect(out[0].property).toBe('background-color')
  })
})
