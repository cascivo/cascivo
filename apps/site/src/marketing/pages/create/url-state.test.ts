import { describe, it, expect } from 'vitest'
import { configToHash, hashToConfig } from './url-state'
import { DEFAULT_CONFIG } from './store'
import type { ThemeConfig } from './store'

describe('URL hash round-trip', () => {
  it('encodes and decodes DEFAULT_CONFIG identically', () => {
    const hash = configToHash(DEFAULT_CONFIG)
    const decoded = hashToConfig(hash)
    expect(decoded).toEqual(DEFAULT_CONFIG)
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

  it('returns null for an empty string', () => {
    expect(hashToConfig('')).toBeNull()
  })

  it('returns null for an invalid base64 string', () => {
    expect(hashToConfig('!!!invalid!!!')).toBeNull()
  })
})
