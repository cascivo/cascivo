import { describe, it, expect } from 'vitest'
import { configToCSS } from './css-gen'
import { DEFAULT_CONFIG } from './store'

describe('configToCSS', () => {
  it('returns a string containing the layer declaration', () => {
    const css = configToCSS(DEFAULT_CONFIG)
    expect(css).toContain('@layer cascade.theme')
    expect(css).toContain('[data-theme="create-custom"]')
  })

  it('includes accent tokens for the given hue', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, accentHue: 120 })
    expect(css).toContain('120')
    expect(css).toContain('--cascivo-color-accent:')
  })

  it('includes radius-base token', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, radiusBase: 0.5 })
    expect(css).toContain('--cascivo-radius-base: 0.5rem')
  })

  it('includes derived radius tokens as calc() expressions', () => {
    const css = configToCSS(DEFAULT_CONFIG)
    expect(css).toContain('--cascivo-radius-surface: calc(var(--cascivo-radius-base) * 1.66)')
  })

  it('includes font-sans for non-system font', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, fontFamily: 'geometric' })
    expect(css).toContain('--cascivo-font-sans:')
    expect(css).toContain('Century Gothic')
  })

  it('does not include font-sans for system font (uses base theme default)', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, fontFamily: 'system' })
    expect(css).not.toContain('--cascivo-font-sans:')
  })

  it('uses dark lightness values when baseMode is dark', () => {
    const light = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'light', accentHue: 250 })
    const dark = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'dark', accentHue: 250 })
    expect(dark).toContain('oklch(0.65')
    expect(light).toContain('oklch(0.52')
  })

  it('starts with a comment referencing the base theme import', () => {
    const light = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'light' })
    const dark = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'dark' })
    expect(light).toContain('@cascivo/themes/light.css')
    expect(dark).toContain('@cascivo/themes/dark.css')
  })

  it('previewMode=false omits base surface tokens', () => {
    const css = configToCSS(DEFAULT_CONFIG)
    expect(css).not.toContain('--cascivo-color-background:')
    expect(css).not.toContain('color-scheme:')
  })

  it('previewMode=true includes light surface tokens', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'light' }, true)
    expect(css).toContain('color-scheme: light')
    expect(css).toContain('--cascivo-color-background: oklch(1 0 0)')
    expect(css).toContain('--cascivo-color-foreground: oklch(0.145')
  })

  it('previewMode=true includes dark surface tokens', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, baseMode: 'dark' }, true)
    expect(css).toContain('color-scheme: dark')
    expect(css).toContain('--cascivo-color-background: oklch(0.145 0.005 250)')
    expect(css).toContain('--cascivo-color-foreground: oklch(0.985')
  })
})
