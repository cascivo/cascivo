/**
 * Canonical breakpoint scale for cascivo.
 *
 * These match the --cascivo-screen-* CSS custom properties in index.css.
 * Use SCREEN.*.px for matchMedia and Playwright numeric widths.
 * Use minWidth() / maxWidth() to build matchMedia strings.
 *
 * CSS @media/@container CANNOT read var() — copy the rem value directly.
 * The breakpoint:check lint (scripts/checks/breakpoint.test.ts) guards drift.
 */
export const SCREEN = {
  sm: { rem: '30rem', px: 480 },
  md: { rem: '40rem', px: 640 },
  lg: { rem: '64rem', px: 1024 },
  xl: { rem: '80rem', px: 1280 },
} as const

export type ScreenKey = keyof typeof SCREEN

/** Returns a min-width matchMedia string, e.g. '(min-width: 64rem)' */
export function minWidth(bp: ScreenKey): string {
  return `(min-width: ${SCREEN[bp].rem})`
}

/** Returns a max-width matchMedia string, e.g. '(max-width: 64rem)' */
export function maxWidth(bp: ScreenKey): string {
  return `(max-width: ${SCREEN[bp].rem})`
}
