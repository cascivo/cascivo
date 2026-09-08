import { describe, expect, it } from 'vitest'
import { atRuleSlug, elementSlug, propertySlug, valueSlugs } from './slugs.ts'

describe('propertySlug', () => {
  it('follows the mechanical rule for an ordinary property', () => {
    expect(propertySlug('background-color')).toBe('css-background-color')
  })

  it('folds row/column gap onto the one gap slug', () => {
    expect(propertySlug('row-gap')).toBe('css-gap')
    expect(propertySlug('column-gap')).toBe('css-gap')
  })
})

describe('valueSlugs', () => {
  it('gates display on its value, since the property alone says nothing', () => {
    expect(valueSlugs('display', 'flex')).toContain('css-display-flex')
    expect(valueSlugs('display', 'grid')).toContain('css-display-grid')
    expect(valueSlugs('display', 'block')).toEqual([])
  })

  it('detects colour functions anywhere in the value', () => {
    expect(valueSlugs('color', 'oklch(0.5 0.1 20)')).toContain('css-modern-color')
    expect(valueSlugs('box-shadow', '0 1px 2px oklch(0 0 0 / 0.05)')).toContain('css-modern-color')
    expect(valueSlugs('background', 'color-mix(in oklch, red 50%, blue)')).toContain(
      'css-function-color-mix',
    )
  })

  it('detects var() so a leaked custom property cannot pass the lint', () => {
    expect(valueSlugs('color', 'var(--cascivo-color-text)')).toContain('css-variables')
  })

  it('detects units that carry their own support slug', () => {
    expect(valueSlugs('font-size', '1rem')).toContain('css-unit-rem')
    expect(valueSlugs('font-size', '14px')).not.toContain('css-unit-rem')
  })

  it('does not mistake a substring for a function call', () => {
    // `--brand-max(` is not `max(`; a naive `includes` would flag it.
    expect(valueSlugs('width', 'calc(100% - 8px)')).toContain('css-unit-calc')
    expect(valueSlugs('font-family', 'Varela, sans-serif')).not.toContain('css-variables')
  })
})

describe('atRuleSlug', () => {
  it('separates the media-feature variants that have their own slugs', () => {
    expect(atRuleSlug('@media')).toBe('css-at-media')
    expect(atRuleSlug('@media', '(prefers-color-scheme: dark)')).toBe(
      'css-at-media-prefers-color-scheme',
    )
    expect(atRuleSlug('@media', '(max-width: 600px)')).toBe('css-at-media')
  })
})

describe('elementSlug', () => {
  it('lowercases and prefixes', () => {
    expect(elementSlug('TABLE')).toBe('html-table')
  })
})
