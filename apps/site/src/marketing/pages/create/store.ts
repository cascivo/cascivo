import { signal } from '@cascivo/core'
import { DEFAULT_CONFIG, type ThemeConfig } from '@cascivo/theme-kit'

// Theme-config types + constants live in @cascivo/theme-kit so the site builder
// and the `cascivo theme create` CLI share one definition. Re-exported here so
// existing local imports (`./store`) keep working.
export {
  type FontFamily,
  type RadiusStop,
  type ThemeConfig,
  RADIUS_STOPS,
  RADIUS_LABELS,
  DEFAULT_CONFIG,
} from '@cascivo/theme-kit'

export const config = signal<ThemeConfig>(DEFAULT_CONFIG)
