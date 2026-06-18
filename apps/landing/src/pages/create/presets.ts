// Preset configs extracted from packages/themes/src/*.css
// When a theme file changes its accent/radius/font tokens, update the matching preset here.
import type { ThemeConfig } from './store'

export type Preset = {
  id: string
  label: string
  swatchBg: string
  swatchAccent: string
  config: ThemeConfig
}

export const PRESETS: Preset[] = [
  {
    id: 'light',
    label: 'Light',
    swatchBg: 'oklch(1 0 0)',
    swatchAccent: 'oklch(0.52 0.2 250)',
    config: {
      baseMode: 'light',
      accentHue: 250,
      accentChroma: 0.2,
      radiusBase: 0.375,
      fontFamily: 'system',
      presetId: 'light',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    swatchBg: 'oklch(0.145 0.005 250)',
    swatchAccent: 'oklch(0.65 0.2 250)',
    config: {
      baseMode: 'dark',
      accentHue: 250,
      accentChroma: 0.2,
      radiusBase: 0.375,
      fontFamily: 'system',
      presetId: 'dark',
    },
  },
  {
    id: 'warm',
    label: 'Warm',
    swatchBg: 'oklch(0.995 0.006 80)',
    swatchAccent: 'oklch(0.768 0.145 75)',
    config: {
      baseMode: 'light',
      accentHue: 75,
      accentChroma: 0.145,
      radiusBase: 0.5,
      fontFamily: 'system',
      presetId: 'warm',
    },
  },
  {
    id: 'flat',
    label: 'Flat',
    swatchBg: 'oklch(1 0 0)',
    swatchAccent: 'oklch(0.5 0.2 145)',
    config: {
      baseMode: 'light',
      accentHue: 145,
      accentChroma: 0.2,
      radiusBase: 0,
      fontFamily: 'system',
      presetId: 'flat',
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    swatchBg: 'oklch(0.98 0.005 80)',
    swatchAccent: 'oklch(0.25 0.01 80)',
    config: {
      baseMode: 'light',
      accentHue: 80,
      accentChroma: 0.05,
      radiusBase: 0.75,
      fontFamily: 'system',
      presetId: 'minimal',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    swatchBg: 'oklch(0.16 0.02 280)',
    swatchAccent: 'oklch(0.7 0.22 290)',
    config: {
      baseMode: 'dark',
      accentHue: 290,
      accentChroma: 0.22,
      radiusBase: 0.5,
      fontFamily: 'system',
      presetId: 'midnight',
    },
  },
  {
    id: 'pastel',
    label: 'Pastel',
    swatchBg: 'oklch(0.99 0.01 330)',
    swatchAccent: 'oklch(0.68 0.18 350)',
    config: {
      baseMode: 'light',
      accentHue: 350,
      accentChroma: 0.18,
      radiusBase: 0.75,
      fontFamily: 'system',
      presetId: 'pastel',
    },
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    swatchBg: 'oklch(0.97 0.02 95)',
    swatchAccent: 'oklch(0.88 0.19 105)',
    config: {
      baseMode: 'light',
      accentHue: 105,
      accentChroma: 0.19,
      radiusBase: 0,
      fontFamily: 'system',
      presetId: 'brutalist',
    },
  },
  {
    id: 'corporate',
    label: 'Corporate',
    swatchBg: 'oklch(0.99 0.003 250)',
    swatchAccent: 'oklch(0.5 0.16 255)',
    config: {
      baseMode: 'light',
      accentHue: 255,
      accentChroma: 0.16,
      radiusBase: 0.25,
      fontFamily: 'system',
      presetId: 'corporate',
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    swatchBg: 'oklch(0.17 0.01 150)',
    swatchAccent: 'oklch(0.82 0.2 145)',
    config: {
      baseMode: 'dark',
      accentHue: 145,
      accentChroma: 0.2,
      radiusBase: 0,
      fontFamily: 'mono',
      presetId: 'terminal',
    },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    swatchBg: 'oklch(0.16 0.03 285)',
    swatchAccent: 'oklch(0.7 0.25 330)',
    config: {
      baseMode: 'dark',
      accentHue: 330,
      accentChroma: 0.25,
      radiusBase: 0,
      fontFamily: 'system',
      presetId: 'cyberpunk',
    },
  },
  {
    id: 'arcade',
    label: 'Arcade',
    swatchBg: 'oklch(0.96 0.008 250)',
    swatchAccent: 'oklch(0.55 0.22 27)',
    config: {
      baseMode: 'light',
      accentHue: 27,
      accentChroma: 0.22,
      radiusBase: 0,
      fontFamily: 'mono',
      presetId: 'arcade',
    },
  },
]
