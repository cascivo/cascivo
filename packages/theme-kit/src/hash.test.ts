import { describe, it, expect } from 'vitest'
import { configToHash, hashToConfig } from './hash'
import { DEFAULT_CONFIG, type ThemeConfig } from './config'

describe('config hash codec', () => {
  it('round-trips the default config', () => {
    expect(hashToConfig(configToHash(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG)
  })

  it('round-trips a custom config', () => {
    const custom: ThemeConfig = {
      baseMode: 'dark',
      accentHue: 42,
      accentChroma: 0.15,
      radiusBase: 1.5,
      fontFamily: 'mono',
      presetId: null,
    }
    expect(hashToConfig(configToHash(custom))).toEqual(custom)
  })

  it('produces URL-safe output (no +, /, or =)', () => {
    const hash = configToHash({ ...DEFAULT_CONFIG, accentHue: 359, accentChroma: 0.37 })
    expect(hash).not.toMatch(/[+/=]/)
  })

  it('returns null for empty or malformed input', () => {
    expect(hashToConfig('')).toBeNull()
    expect(hashToConfig('!!!not-base64!!!')).toBeNull()
  })

  it('falls back to defaults for missing fields', () => {
    const hash = configToHash({ baseMode: 'dark' } as ThemeConfig)
    const decoded = hashToConfig(hash)
    expect(decoded?.baseMode).toBe('dark')
    expect(decoded?.accentHue).toBe(DEFAULT_CONFIG.accentHue)
  })
})
