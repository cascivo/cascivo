// No framework imports: the page, its unit test and the node browser check share these tables
// and the meter maths, so the relative import spells out its extension for node.
import { SAMPLE, WEIGHT_STOPS } from './data.ts'

export { SAMPLE }

/** Allowed drift from the 400 width, in percent. */
export interface WidthLimit {
  under: number
  over: number
}

export interface WidthRow {
  delta: number
  label: string
  over: boolean
}

/** Text weights hold ±2%; the display weights may run wider (they are set large, in headings). */
const TEXT_LIMIT: WidthLimit = { under: 2, over: 2 }
const DISPLAY_LIMIT: WidthLimit = { under: 2, over: 5 }

export interface SpecimenWeight {
  value: number
  name: string
  /** 100-200 are too fine for small sizes and 800-900 are heading weights. */
  display: boolean
  /** Short role label shown next to the weight name. */
  note: string
}

const NOTES: Record<number, string> = {
  100: 'display weight',
  200: 'display weight',
  300: 'lightest text weight',
  800: 'display weight',
  900: 'display weight',
}

export const SPECIMEN_WEIGHTS: readonly SpecimenWeight[] = WEIGHT_STOPS.map(({ value, name }) => ({
  value,
  name,
  display: value <= 200 || value >= 800,
  note: NOTES[value] ?? '',
}))

export const BASE_INDEX = SPECIMEN_WEIGHTS.findIndex((w) => w.value === 400)

/** The width limit that applies to a weight: the display range 800-900 may be 5% wider. */
export function limitFor(weight: number): WidthLimit {
  return weight >= 800 ? DISPLAY_LIMIT : TEXT_LIMIT
}

// A float epsilon: 102 / 100 - 1 is 0.02000000000000002, which is not "past +2.0".
const EPSILON = 1e-9
const MINUS = '−'

/**
 * Each width against `widths[baseIndex]`, in percent, with its own limit. The label is one
 * decimal with a sign; a negative one uses the true minus so it lines up with the plus.
 */
export function widthDelta(
  widths: readonly number[],
  baseIndex: number,
  limits: readonly WidthLimit[],
): WidthRow[] {
  const base = widths[baseIndex] ?? 0
  return widths.map((width, i) => {
    const delta = base === 0 ? 0 : (width / base - 1) * 100
    const limit = limits[i] ?? TEXT_LIMIT
    const fixed = Math.abs(delta).toFixed(1)
    const label = Number(fixed) === 0 ? `${fixed}%` : delta > 0 ? `+${fixed}%` : `${MINUS}${fixed}%`
    return {
      delta,
      label,
      over: delta > limit.over + EPSILON || delta < -limit.under - EPSILON,
    }
  })
}

/** The meter fill saturates at 10%: 5% of the 80px track per 1% of difference. */
export const METER_CAP = 10

export function meterFill(delta: number): { start: number; size: number } {
  const size = Math.min(Math.abs(delta), METER_CAP) * 5
  return { start: delta < 0 ? 50 - size : 50, size }
}

export const TAB_LABELS = ['Overview', 'Activity', 'Settings', 'Members', 'Billing'] as const

/** The tab row and the width sentence the brief names, for the browser check too. */
export const TAB_SAMPLE = TAB_LABELS.join(' ')

export interface GlyphPair {
  glyphs: string
  note: string
}

export const GLYPH_PAIRS: readonly GlyphPair[] = [
  { glyphs: 'Il1|', note: 'cap I · l · one · bar' },
  { glyphs: 'O0o', note: 'cap O · zero · o' },
  { glyphs: 'rn m', note: 'r+n vs m' },
  { glyphs: 'cl d', note: 'c+l vs d' },
  { glyphs: '5S 2Z', note: 'digits vs caps' },
  { glyphs: '8B 6b', note: 'digits vs letters' },
  { glyphs: 'vv w', note: 'v+v vs w' },
  { glyphs: 'g9 q', note: 'g vs 9 vs q' },
]

export interface FeatureVariant {
  label: string
  /** CSS `font-feature-settings`. */
  features: string
  text: string
  note: string
}

/** Alternates the font ships; `zero` is slashed and wins over `ss01` (dotted) when both are on. */
export const GLYPH_VARIANTS: readonly FeatureVariant[] = [
  { label: 'ss01', features: '"ss01"', text: 'O0o 1001', note: 'dotted zero' },
  { label: 'ss02', features: '"ss02"', text: 'Il1| Illinois', note: 'plain I and l' },
  { label: 'zero', features: '"zero"', text: 'O0o 1001', note: 'slashed zero' },
  { label: 'ss01 + zero', features: '"ss01", "zero"', text: 'O0o 1001', note: 'slashed wins' },
]

export const AMBIGUOUS_CONTEXT =
  'Password: Il1lI0O · Invite code: lIl-1O0-Oo8 · Illinois, 1001 Ill. Ave.'

export const DASHES = [
  { char: '-', name: 'hyphen' },
  { char: '–', name: 'en dash' },
  { char: '—', name: 'em dash' },
  { char: '−', name: 'minus' },
] as const

export const DASH_CONTEXT = 'well-known · 9–5 · wait—now · 4 − 2'
export const QUOTES = '‘H’ “H” «H»'
export const QUOTES_CONTEXT = '“It’s ‘fine’,” she said.'
export const BRACKETS_CAPS = '(HX) [HX] {HX}'
export const BRACKETS_LOWER = '(hx) [hx] {hx}'
/** With `case` on, brackets and dashes sit on the capitals' centre line. */
export const BRACKETS_CASE = '(HX) [HX] {HX} H-X H\u2013X'
export const DOT_WEIGHTS = [100, 400, 900] as const
export const DOT_LINE = 'fast; i.e., done: yes! no? —'

export const CONTROL_STRINGS = [
  'nnonnonn nninnlnnkn',
  'HHOHHOHH HHIHHJHH',
  'ijkl mnop vwxyz rn m',
  'AV To Ty LT Wa yo P. r,',
] as const

export const SMALL_SIZES = [11, 12, 13, 14] as const
export const SMALL_LINE = 'Signed in as Ilya, 10 items, 0 errors. Retry in 15s.'
