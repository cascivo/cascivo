// No imports: `scripts/fonts/sync-site.ts` and `scripts/checks/font-site-sync.test.ts` load
// this module directly under node, so it must stay framework-free.

export interface FontFile {
  name: string
  /** Repo-relative path of the build output this site copy mirrors. */
  source: string
  kind: 'web' | 'desktop' | 'licence'
  label: string
}

const BUILD = 'fonts/cascivo-sans/fonts/'

export const FONT_FILES: readonly FontFile[] = [
  {
    name: 'CascivoSans-Latin[opsz,wght].woff2',
    source: `${BUILD}CascivoSans-Latin[opsz,wght].woff2`,
    kind: 'web',
    label: 'Upright — variable WOFF2',
  },
  {
    name: 'CascivoSans-Italic-Latin[opsz,wght].woff2',
    source: `${BUILD}CascivoSans-Italic-Latin[opsz,wght].woff2`,
    kind: 'web',
    label: 'Italic — variable WOFF2',
  },
  {
    name: 'CascivoSans-Regular.ttf',
    source: `${BUILD}CascivoSans-Regular.ttf`,
    kind: 'desktop',
    label: 'Regular',
  },
  {
    name: 'CascivoSans-Italic.ttf',
    source: `${BUILD}CascivoSans-Italic.ttf`,
    kind: 'desktop',
    label: 'Italic',
  },
  {
    name: 'CascivoSans-Bold.ttf',
    source: `${BUILD}CascivoSans-Bold.ttf`,
    kind: 'desktop',
    label: 'Bold',
  },
  {
    name: 'CascivoSans-BoldItalic.ttf',
    source: `${BUILD}CascivoSans-BoldItalic.ttf`,
    kind: 'desktop',
    label: 'Bold Italic',
  },
  {
    name: 'OFL.txt',
    source: 'fonts/cascivo-sans/OFL.txt',
    kind: 'licence',
    label: 'SIL Open Font License 1.1',
  },
]

export const FONT_BASE = '/fonts/cascivo-sans/'

export const AXES = {
  wght: { min: 100, max: 900, initial: 400 },
  opsz: { min: 8, max: 48, initial: 14 },
  size: { min: 14, max: 96, initial: 40 },
} as const

export type AxisName = keyof typeof AXES

export function clampAxis(axis: AxisName, value: number): number {
  const { min, max, initial } = AXES[axis]
  if (Number.isNaN(value)) return initial
  return Math.min(max, Math.max(min, Math.round(value)))
}

export interface TesterState {
  wght: number
  opsz: number
  size: number
  italic: boolean
}

export function testerStyle(s: TesterState): Record<string, string> {
  return {
    '--cs-wght': String(clampAxis('wght', s.wght)),
    '--cs-opsz': String(clampAxis('opsz', s.opsz)),
    '--cs-size': `${clampAxis('size', s.size)}px`,
    'font-style': s.italic ? 'italic' : 'normal',
  }
}

export const SAMPLE = 'Signals move fast; the cascade decides.'

export const WEIGHT_STOPS: readonly { value: number; name: string }[] = [
  { value: 100, name: 'Thin' },
  { value: 200, name: 'ExtraLight' },
  { value: 300, name: 'Light' },
  { value: 400, name: 'Regular' },
  { value: 500, name: 'Medium' },
  { value: 600, name: 'SemiBold' },
  { value: 700, name: 'Bold' },
  { value: 800, name: 'ExtraBold' },
  { value: 900, name: 'Black' },
]
