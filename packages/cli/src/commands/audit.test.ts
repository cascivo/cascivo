import { describe, expect, it } from 'vitest'
import { buildContract } from '../utils/contract.js'
import { fixCssLiterals } from './audit.js'

const contract = buildContract({
  catalog: {
    tokens: [
      { name: '--cascivo-color-accent', resolvedDefault: '#3b82f6' },
      { name: '--cascivo-color-primary', resolvedDefault: '#ff0000' },
      { name: '--cascivo-color-brand', resolvedDefault: '#ff0000' },
    ],
  },
  registry: { components: [] },
  context: { components: [] },
})

describe('fixCssLiterals', () => {
  it('rewrites a single-match hex literal to a token and reports the count', () => {
    const out = fixCssLiterals('a { color: #3b82f6; }', 'a.css', contract)
    expect(out.source).toBe('a { color: var(--cascivo-color-accent); }')
    expect(out.fixed).toBe(1)
  })

  it('does not rewrite ambiguous (multi-token) literals', () => {
    const out = fixCssLiterals('a { color: #ff0000; }', 'a.css', contract)
    expect(out.source).toBe('a { color: #ff0000; }')
    expect(out.fixed).toBe(0)
  })

  it('does not rewrite non-hex literals (oklch left for manual review)', () => {
    const c = buildContract({
      catalog: {
        tokens: [{ name: '--cascivo-gray-700', resolvedDefault: 'oklch(0.373 0.015 264)' }],
      },
      registry: { components: [] },
      context: { components: [] },
    })
    const src = 'a { color: oklch(0.373 0.015 264); }'
    expect(fixCssLiterals(src, 'a.css', c).source).toBe(src)
  })

  it('leaves source untouched when there is nothing to fix', () => {
    const out = fixCssLiterals('a { color: var(--cascivo-color-accent); }', 'a.css', contract)
    expect(out.fixed).toBe(0)
  })
})
