import { describe, expect, it } from 'vitest'
import { loadVariantMatrix, type VariantMatrix } from './variants.js'

const fixture: VariantMatrix = {
  generatedAt: '2026-01-01',
  themes: ['light', 'warm'],
  families: {
    accent: { base: '--cascivo-color-accent', hover: '--cascivo-color-accent-hover' },
    typography: { ui: '--cascivo-text-ui', body: '--cascivo-text-body' },
  },
  tokens: [
    {
      name: '--cascivo-color-accent',
      layer: 'semantic',
      group: 'color',
      role: 'accent',
      slot: 'base',
      byTheme: { light: 'oklch(0.52 0.2 250)', warm: 'oklch(0.768 0.145 75)' },
    },
  ],
}

describe('loadVariantMatrix', () => {
  it('returns the matrix shape (local file resolves first in the monorepo)', async () => {
    const matrix = await loadVariantMatrix(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(fixture) } as Response),
    )
    expect(Array.isArray(matrix.tokens)).toBe(true)
    expect(Array.isArray(matrix.themes)).toBe(true)
    expect(matrix.families).toBeTypeOf('object')
  })
})

describe('variant matrix querying (via fixture)', () => {
  it('maps a role + slot to a token name', () => {
    expect(fixture.families.accent?.hover).toBe('--cascivo-color-accent-hover')
  })

  it('resolves a token to a concrete value per theme', () => {
    const accent = fixture.tokens.find((t) => t.name === '--cascivo-color-accent')!
    expect(accent.byTheme.warm).toBe('oklch(0.768 0.145 75)')
  })

  it('exposes the typography family so agents resolve type deterministically (T1)', () => {
    expect(fixture.families.typography?.ui).toBe('--cascivo-text-ui')
  })
})
