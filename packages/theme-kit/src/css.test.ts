import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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

  // BASE_LIGHT/BASE_DARK are hand-copied "resolved concrete values" from the
  // canonical themes, so they drift silently. They shipped without
  // --cascivo-color-info-foreground, which is what Alert's title reads: the
  // preview fell through to whatever theme the surrounding page was on, and
  // the light preview took the dark page's pale blue on its own white card.
  describe.each([
    ['light', 'light.css'],
    ['dark', 'dark.css'],
  ] as const)('%s preview base is self-contained', (baseMode, themeFile) => {
    it('carries every -foreground variant the canonical theme declares', () => {
      const theme = readFileSync(
        fileURLToPath(new URL(`../../themes/src/${themeFile}`, import.meta.url)),
        'utf8',
      )
      const declared = [...theme.matchAll(/--cascivo-color-[\w-]*-foreground(?=\s*:)/g)].map(
        (m) => m[0],
      )
      expect(declared.length).toBeGreaterThan(0)
      const css = configToCSS({ ...DEFAULT_CONFIG, baseMode }, { previewMode: true })
      for (const token of new Set(declared)) {
        expect(css, `${token} missing from the ${baseMode} preview base`).toContain(`${token}:`)
      }
    })
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
