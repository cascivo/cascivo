/**
 * Cinematic palette derived from the cascivo brand: the brand blue accent
 * (oklch(0.52 0.2 250)) and the AI purple (#8b5cf6), set on a deep near-black
 * stage for contrast. Values are plain CSS strings so Remotion's Chromium
 * renderer can use them directly.
 */
export const color = {
  bg: '#06080e',
  bgAlt: '#0b0e17',
  surface: '#12151f',
  surfaceRaised: '#1a1e2b',
  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#f6f8fc',
  textMuted: '#9aa4b6',
  textFaint: '#5b6577',
  accent: '#3b82f6',
  accentBright: '#5fa3ff',
  accentDeep: '#0079bf',
  cyan: '#22d3ee',
  ai: '#8b5cf6',
  aiBright: '#a78bfa',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#fb6f6f',
} as const

export const font = {
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, "Cascadia Code", "Roboto Mono", monospace',
} as const

export const gradient = {
  brand: `linear-gradient(110deg, ${color.accentBright}, ${color.cyan})`,
  ai: `linear-gradient(110deg, ${color.aiBright}, ${color.accent})`,
  warm: `linear-gradient(110deg, ${color.warning}, ${color.danger})`,
} as const
