import type { ThemeConfig } from './store'
import { DEFAULT_CONFIG } from './store'

export function configToHash(config: ThemeConfig): string {
  const json = JSON.stringify(config)
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function hashToConfig(hash: string): ThemeConfig | null {
  if (!hash) return null
  try {
    const base64 = hash.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const parsed = JSON.parse(json) as Partial<ThemeConfig>
    return {
      baseMode: parsed.baseMode === 'dark' ? 'dark' : 'light',
      accentHue: typeof parsed.accentHue === 'number' ? parsed.accentHue : DEFAULT_CONFIG.accentHue,
      accentChroma:
        typeof parsed.accentChroma === 'number' ? parsed.accentChroma : DEFAULT_CONFIG.accentChroma,
      radiusBase: (typeof parsed.radiusBase === 'number'
        ? parsed.radiusBase
        : DEFAULT_CONFIG.radiusBase) as ThemeConfig['radiusBase'],
      fontFamily: parsed.fontFamily ?? DEFAULT_CONFIG.fontFamily,
      presetId: parsed.presetId ?? null,
    }
  } catch {
    return null
  }
}

let _debounce = 0
export function pushHashState(config: ThemeConfig) {
  clearTimeout(_debounce)
  _debounce = window.setTimeout(() => {
    history.replaceState(null, '', '#' + configToHash(config))
  }, 300)
}
