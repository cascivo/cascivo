import { describe, it, expect } from 'vitest'
import { configToCSS } from './css'
import { DEFAULT_CONFIG } from './config'

describe('configToCSS', () => {
  it('defaults the selector to create-custom', () => {
    const css = configToCSS(DEFAULT_CONFIG)
    expect(css).toContain('@layer cascivo.theme')
    expect(css).toContain('[data-theme="create-custom"]')
  })

  it('honors a custom theme name (CLI handoff)', () => {
    const css = configToCSS(DEFAULT_CONFIG, { themeName: 'acme' })
    expect(css).toContain('[data-theme="acme"]')
    expect(css).not.toContain('create-custom')
  })

  it('includes accent + radius tokens', () => {
    const css = configToCSS({ ...DEFAULT_CONFIG, accentHue: 120, radiusBase: 0.5 })
    expect(css).toContain('120')
    expect(css).toContain('--cascivo-color-accent:')
    expect(css).toContain('--cascivo-radius-base: 0.5rem')
  })

  it('omits base surface tokens unless previewMode is set', () => {
    expect(configToCSS(DEFAULT_CONFIG)).not.toContain('color-scheme:')
    expect(configToCSS(DEFAULT_CONFIG, { previewMode: true })).toContain('color-scheme: light')
  })

  it('emits font-sans only for a non-system font', () => {
    expect(configToCSS({ ...DEFAULT_CONFIG, fontFamily: 'geometric' })).toContain(
      '--cascivo-font-sans:',
    )
    expect(configToCSS({ ...DEFAULT_CONFIG, fontFamily: 'system' })).not.toContain(
      '--cascivo-font-sans:',
    )
  })
})
