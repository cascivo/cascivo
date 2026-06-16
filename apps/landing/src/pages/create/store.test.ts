import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, RADIUS_STOPS } from './store'
import { PRESETS } from './presets'

describe('DEFAULT_CONFIG', () => {
  it('has all required fields with valid values', () => {
    expect(DEFAULT_CONFIG.baseMode).toBe('light')
    expect(DEFAULT_CONFIG.accentHue).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_CONFIG.accentHue).toBeLessThanOrEqual(360)
    expect(DEFAULT_CONFIG.accentChroma).toBeGreaterThanOrEqual(0.05)
    expect(DEFAULT_CONFIG.accentChroma).toBeLessThanOrEqual(0.3)
    expect([0, 0.25, 0.375, 0.5, 0.75, 1.5]).toContain(DEFAULT_CONFIG.radiusBase)
    expect(['system', 'geometric', 'humanist', 'transitional', 'mono']).toContain(
      DEFAULT_CONFIG.fontFamily,
    )
    expect(DEFAULT_CONFIG.presetId).toBe('light')
  })
})

describe('PRESETS', () => {
  it('has exactly 10 presets', () => {
    expect(PRESETS).toHaveLength(10)
  })

  it('each preset has valid ThemeConfig fields', () => {
    for (const p of PRESETS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(['light', 'dark']).toContain(p.config.baseMode)
      expect(p.config.accentHue).toBeGreaterThanOrEqual(0)
      expect(p.config.accentHue).toBeLessThanOrEqual(360)
      expect(RADIUS_STOPS).toContain(p.config.radiusBase)
    }
  })

  it('each preset id is unique', () => {
    const ids = PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
