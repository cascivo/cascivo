import { DEFAULT_CONFIG, type ThemeConfig } from './config.js'

/** Encode a theme config as a URL-safe base64 string (shared by the /create URL
 *  hash and the CLI `--from` handoff, so the two never drift). */
export function configToHash(config: ThemeConfig): string {
  const json = JSON.stringify(config)
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Decode a hash produced by {@link configToHash}. Returns null on malformed
 *  input; unknown/missing fields fall back to {@link DEFAULT_CONFIG}. */
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
