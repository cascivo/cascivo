import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildVariantMatrix, resolveInTheme, splitRole } from './generate.ts'

const INDEX_CSS = `
@layer cascivo.tokens {
  :root {
    --cascivo-blue-500: oklch(0.62 0.21 259);
    --cascivo-red-600: oklch(0.58 0.22 25);
    --cascivo-color-accent: var(--cascivo-blue-500);
    --cascivo-color-accent-hover: var(--cascivo-blue-500);
    --cascivo-radius-base: 0.375rem;
    --cascivo-radius-button: var(--cascivo-radius-base);
    --cascivo-text-sm: 0.875rem;
    --cascivo-text-base: 1rem;
    --cascivo-text-ui: var(--cascivo-text-sm);
    --cascivo-text-body: var(--cascivo-text-base);
  }
}
`

const LIGHT_CSS = `
@layer cascivo.theme {
  [data-theme='light'] {
    --cascivo-color-accent: oklch(0.52 0.2 250);
    --cascivo-color-accent-hover: oklch(0.45 0.2 250);
    --cascivo-color-accent-subtle: var(--cascivo-blue-500);
  }
}
`

const WARM_CSS = `
@layer cascivo.theme {
  [data-theme='warm'] {
    --cascivo-color-accent: oklch(0.768 0.145 75);
    --cascivo-color-accent-hover: oklch(0.7 0.155 70);
    --cascivo-radius-base: 0.5rem;
  }
}
`

describe('splitRole', () => {
  it('returns base slot for a bare role', () => {
    assert.deepEqual(splitRole('--cascivo-color-accent'), { role: 'accent', slot: 'base' })
  })

  it('splits a recognised state slot off the role', () => {
    assert.deepEqual(splitRole('--cascivo-color-accent-hover'), { role: 'accent', slot: 'hover' })
    assert.deepEqual(splitRole('--cascivo-color-primary-foreground'), {
      role: 'primary',
      slot: 'foreground',
    })
  })

  it('returns null for non-colour tokens', () => {
    assert.equal(splitRole('--cascivo-radius-button'), null)
  })
})

describe('resolveInTheme', () => {
  it('follows a var() chain to a concrete value', () => {
    const map = new Map([
      ['--cascivo-blue-500', 'oklch(0.62 0.21 259)'],
      ['--cascivo-color-accent', 'var(--cascivo-blue-500)'],
    ])
    assert.equal(resolveInTheme('--cascivo-color-accent', map), 'oklch(0.62 0.21 259)')
  })

  it('keeps calc() verbatim', () => {
    const map = new Map([['--cascivo-radius-card', 'calc(var(--cascivo-radius-base) * 1.66)']])
    assert.equal(
      resolveInTheme('--cascivo-radius-card', map),
      'calc(var(--cascivo-radius-base) * 1.66)',
    )
  })

  it('returns null for an undefined token', () => {
    assert.equal(resolveInTheme('--cascivo-missing', new Map()), null)
  })
})

describe('buildVariantMatrix', () => {
  const matrix = buildVariantMatrix(INDEX_CSS, [
    { name: 'light', css: LIGHT_CSS },
    { name: 'warm', css: WARM_CSS },
  ])

  it('lists the theme names', () => {
    assert.deepEqual(matrix.themes, ['light', 'warm'])
  })

  it('excludes primitive tokens', () => {
    assert.ok(!matrix.tokens.some((t) => t.name === '--cascivo-blue-500'))
  })

  it('resolves a semantic token per theme', () => {
    const accent = matrix.tokens.find((t) => t.name === '--cascivo-color-accent')!
    assert.equal(accent.byTheme.light, 'oklch(0.52 0.2 250)')
    assert.equal(accent.byTheme.warm, 'oklch(0.768 0.145 75)')
  })

  it('resolves a per-theme var() override against the theme-local primitive map', () => {
    const subtle = matrix.tokens.find((t) => t.name === '--cascivo-color-accent-subtle')!
    // Defined only in light; resolves through the shared primitive.
    assert.equal(subtle.byTheme.light, 'oklch(0.62 0.21 259)')
    assert.equal(subtle.byTheme.warm, null)
  })

  it('tags colour tokens with role and slot', () => {
    const hover = matrix.tokens.find((t) => t.name === '--cascivo-color-accent-hover')!
    assert.equal(hover.role, 'accent')
    assert.equal(hover.slot, 'hover')
  })

  it('builds a family mapping intent (role + slot) to token names', () => {
    assert.equal(matrix.families.accent?.base, '--cascivo-color-accent')
    assert.equal(matrix.families.accent?.hover, '--cascivo-color-accent-hover')
  })

  it('builds a typography family mapping role → token (post-1 "ui.default")', () => {
    assert.equal(matrix.families.typography?.ui, '--cascivo-text-ui')
    assert.equal(matrix.families.typography?.body, '--cascivo-text-body')
  })

  it('resolves a typography role to a theme-invariant primitive size', () => {
    const ui = matrix.tokens.find((t) => t.name === '--cascivo-text-ui')!
    assert.equal(ui.role, 'ui')
    assert.equal(ui.slot, 'base')
    assert.equal(ui.byTheme.light, '0.875rem')
    assert.equal(ui.byTheme.warm, '0.875rem')
  })

  it('excludes primitive type scale steps from the matrix', () => {
    assert.ok(!matrix.tokens.some((t) => t.name === '--cascivo-text-sm'))
  })

  it('reflects per-theme component-token resolution shifts', () => {
    const radiusBtn = matrix.tokens.find((t) => t.name === '--cascivo-radius-button')!
    // radius-button → radius-base, which differs between light (0.375rem) and warm (0.5rem).
    assert.equal(radiusBtn.byTheme.light, '0.375rem')
    assert.equal(radiusBtn.byTheme.warm, '0.5rem')
  })
})
