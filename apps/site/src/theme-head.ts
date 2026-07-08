// Single source of truth for `/docs/themes/<name>` page copy + head. Consumed
// by ThemePage.tsx (on-page content), seo.ts (runtime head), and
// vite.config.ts (build-time prerender) — kept import-free (no registry/
// document) so the Vite config can import it safely, mirroring
// category-head.ts and component-head.ts.
//
// Taglines are copied verbatim from each theme's header comment in
// packages/themes/src/<name>.css — real, authored copy, not invented. Keep in
// sync if a theme's tagline changes; NON_THEME_CSS in vite.config.ts /
// scripts/readme/generate.ts is the list of CSS files that are NOT themes.

export type ThemeName =
  | 'arcade'
  | 'brutalist'
  | 'corporate'
  | 'cyberpunk'
  | 'dark'
  | 'flat'
  | 'light'
  | 'midnight'
  | 'minimal'
  | 'pastel'
  | 'terminal'
  | 'warm'

export const THEME_ORDER: ThemeName[] = [
  'light',
  'dark',
  'warm',
  'corporate',
  'minimal',
  'flat',
  'midnight',
  'pastel',
  'terminal',
  'cyberpunk',
  'brutalist',
  'arcade',
]

export const THEME_LABELS: Record<ThemeName, string> = {
  arcade: 'Arcade',
  brutalist: 'Brutalist',
  corporate: 'Corporate',
  cyberpunk: 'Cyberpunk',
  dark: 'Dark',
  flat: 'Flat',
  light: 'Light',
  midnight: 'Midnight',
  minimal: 'Minimal',
  pastel: 'Pastel',
  terminal: 'Terminal',
  warm: 'Warm',
}

export const THEME_TAGLINES: Record<ThemeName, string> = {
  arcade:
    '8-bit / pixel-arcade: bright cool paper, coin-op red, electric blue, zero radius, hard shadows, pixel display font',
  brutalist: 'Neo-brutalism: cream background, zero radius, thick borders, hard offset shadows',
  corporate: 'Enterprise/data-dense, crisp 2px radius, conservative blue, tight hairlines',
  cyberpunk:
    'Brutalism × cyberpunk: near-black base, neon magenta/cyan, zero radius, hard glow shadows',
  dark: 'Bold/editorial, high contrast, developer-cool',
  flat: 'Zero shadows, zero radius, high-contrast borders, vivid green accent',
  light: 'Minimal/sharp, neutral grays, clean lines',
  midnight: 'Premium dark, deep indigo-black, violet accent, soft colored glow',
  minimal: 'Very subtle shadows, rounder radius, near-invisible borders, monochrome accent',
  pastel: 'Playful/consumer, soft candy palette, pill controls, diffuse shadows',
  terminal: 'Developer/CLI, phosphor green on near-black, zero radius, green glow',
  warm: 'Organic/approachable, warm neutrals, rounded',
}

export function isThemeName(value: string): value is ThemeName {
  return (THEME_ORDER as string[]).includes(value)
}

/** Kept under 60 chars for every theme so it won't truncate in SERPs. */
export function themeTitle(theme: ThemeName): string {
  return `${THEME_LABELS[theme]} theme — cascivo`
}

export function themeDescription(theme: ThemeName): string {
  return `The ${THEME_LABELS[theme]} theme for cascivo: ${THEME_TAGLINES[theme]}. One CSS import and a data-theme attribute — no build step.`
}
