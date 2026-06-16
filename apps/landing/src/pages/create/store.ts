import { signal } from '@cascivo/core'

export type FontFamily = 'system' | 'geometric' | 'humanist' | 'transitional' | 'mono'

export const RADIUS_STOPS = [0, 0.25, 0.375, 0.5, 0.75, 1.5] as const
export type RadiusStop = (typeof RADIUS_STOPS)[number]

export const RADIUS_LABELS: Record<RadiusStop, string> = {
  0: 'none',
  0.25: 'sm',
  0.375: 'md',
  0.5: 'lg',
  0.75: 'xl',
  1.5: 'pill',
}

export type ThemeConfig = {
  baseMode: 'light' | 'dark'
  accentHue: number
  accentChroma: number
  radiusBase: RadiusStop
  fontFamily: FontFamily
  presetId: string | null
}

export const DEFAULT_CONFIG: ThemeConfig = {
  baseMode: 'light',
  accentHue: 250,
  accentChroma: 0.2,
  radiusBase: 0.375,
  fontFamily: 'system',
  presetId: 'light',
}

export const config = signal<ThemeConfig>(DEFAULT_CONFIG)
