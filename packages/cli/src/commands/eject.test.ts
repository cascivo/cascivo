import { describe, expect, it } from 'vitest'
import { buildOverrideCss } from './eject.js'

describe('buildOverrideCss', () => {
  const css = buildOverrideCss({
    component: 'button',
    scope: "[data-cascivo-eject='button']",
    tokens: [
      { name: '--cascivo-color-accent', value: 'oklch(0.52 0.2 250)' },
      { name: '--cascivo-radius-button', value: '0.375rem' },
      { name: '--cascivo-color-accent-subtle', value: null },
    ],
  })

  it('emits the scope selector', () => {
    expect(css).toContain("[data-cascivo-eject='button'] {")
  })

  it('declares resolved token values', () => {
    expect(css).toContain('--cascivo-color-accent: oklch(0.52 0.2 250);')
    expect(css).toContain('--cascivo-radius-button: 0.375rem;')
  })

  it('comments out tokens with no resolved value', () => {
    expect(css).toContain('/* --cascivo-color-accent-subtle: set a value')
    expect(css).not.toContain('--cascivo-color-accent-subtle: null')
  })

  it('is unlayered so it wins over themed @layer values', () => {
    expect(css).not.toContain('@layer')
  })

  it('names the component in the header comment', () => {
    expect(css.startsWith('/* cascivo eject — button')).toBe(true)
  })
})
