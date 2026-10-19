import { describe, expect, it } from 'vitest'
import {
  CONTROL_STRINGS,
  GLYPH_PAIRS,
  METER_CAP,
  SMALL_SIZES,
  SPECIMEN_WEIGHTS,
  TAB_LABELS,
  limitFor,
  meterFill,
  widthDelta,
} from './specimen'

const TEXT = { under: 2, over: 2 }
const DISPLAY = { under: 2, over: 5 }

describe('widthDelta', () => {
  it('is zero at the base and labels it without a sign', () => {
    const [row] = widthDelta([400], 0, [TEXT])
    expect(row).toEqual({ delta: 0, label: '0.0%', over: false })
  })

  it('labels a wider row with a plus sign and one decimal', () => {
    const rows = widthDelta([1000, 1014], 0, [TEXT, TEXT])
    expect(rows[1]?.label).toBe('+1.4%')
    expect(rows[1]?.over).toBe(false)
  })

  it('labels a narrower row with a real minus sign', () => {
    const rows = widthDelta([1000, 979], 0, [TEXT, TEXT])
    expect(rows[1]?.label).toBe('−2.1%')
    expect(rows[1]?.over).toBe(true)
  })

  it('treats exactly +2.0 and -2.0 as inside the text-weight limit', () => {
    const rows = widthDelta([1000, 1020, 980], 0, [TEXT, TEXT, TEXT])
    expect(rows[1]?.over).toBe(false)
    expect(rows[2]?.over).toBe(false)
  })

  it('flags a text weight past +2.0', () => {
    expect(widthDelta([1000, 1021], 0, [TEXT, TEXT])[1]?.over).toBe(true)
  })

  it('lets display weights run to +5.0 but not past it', () => {
    const rows = widthDelta([1000, 1050, 1051], 0, [DISPLAY, DISPLAY, DISPLAY])
    expect(rows[1]?.over).toBe(false)
    expect(rows[2]?.over).toBe(true)
  })

  it('keeps display weights to -2.0 on the narrow side', () => {
    const rows = widthDelta([1000, 980, 979], 0, [DISPLAY, DISPLAY, DISPLAY])
    expect(rows[1]?.over).toBe(false)
    expect(rows[2]?.over).toBe(true)
  })

  it('measures against the given base, not the first row', () => {
    const rows = widthDelta([900, 1000, 1010], 1, [TEXT, TEXT, TEXT])
    expect(rows[1]?.delta).toBe(0)
    expect(rows[2]?.label).toBe('+1.0%')
  })

  it('is not fooled by floating point at the boundary', () => {
    expect(widthDelta([100, 102], 0, [TEXT, TEXT])[1]?.over).toBe(false)
  })
})

describe('meterFill', () => {
  it('grows right for wider and left for narrower, 5% of the track per 1%', () => {
    expect(meterFill(1)).toEqual({ start: 50, size: 5 })
    expect(meterFill(-1)).toEqual({ start: 45, size: 5 })
  })

  it('caps at the meter limit', () => {
    expect(meterFill(30)).toEqual({ start: 50, size: METER_CAP * 5 })
    expect(meterFill(-30)).toEqual({ start: 50 - METER_CAP * 5, size: METER_CAP * 5 })
  })
})

describe('weights', () => {
  it('lists nine weights, 100 to 900', () => {
    expect(SPECIMEN_WEIGHTS.map((w) => w.value)).toEqual([
      100, 200, 300, 400, 500, 600, 700, 800, 900,
    ])
  })

  it('marks 100, 200, 800 and 900 as display weights, 300 as the lightest text weight', () => {
    const display = SPECIMEN_WEIGHTS.filter((w) => w.display).map((w) => w.value)
    expect(display).toEqual([100, 200, 800, 900])
    expect(SPECIMEN_WEIGHTS.find((w) => w.value === 300)?.note).toBe('lightest text weight')
  })

  it('gives 800 and 900 +5 / -2 and the rest ±2', () => {
    expect(limitFor(700)).toEqual(TEXT)
    expect(limitFor(100)).toEqual(TEXT)
    expect(limitFor(800)).toEqual(DISPLAY)
    expect(limitFor(900)).toEqual(DISPLAY)
  })
})

describe('brief data', () => {
  it('has the eight ambiguous-glyph pairs', () => {
    expect(GLYPH_PAIRS.map((p) => p.glyphs)).toEqual([
      'Il1|',
      'O0o',
      'rn m',
      'cl d',
      '5S 2Z',
      '8B 6b',
      'vv w',
      'g9 q',
    ])
  })

  it('has the four spacing control strings', () => {
    expect(CONTROL_STRINGS).toEqual([
      'nnonnonn nninnlnnkn',
      'HHOHHOHH HHIHHJHH',
      'ijkl mnop vwxyz rn m',
      'AV To Ty LT Wa yo P. r,',
    ])
  })

  it('has the five tabs and the four small sizes 11 to 14', () => {
    expect(TAB_LABELS).toEqual(['Overview', 'Activity', 'Settings', 'Members', 'Billing'])
    expect(SMALL_SIZES).toEqual([11, 12, 13, 14])
  })
})
