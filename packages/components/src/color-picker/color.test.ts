import { describe, expect, it } from 'vitest'
import {
  formatColor,
  hsvToHsl,
  hsvToRgb,
  parseColor,
  parseHex,
  rgbToHsv,
  sameColor,
  toHex,
  toHslString,
  toRgbString,
} from './color'

describe('parseHex', () => {
  it('parses 6-digit hex', () => {
    expect(parseHex('#ff0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('expands 3-digit hex', () => {
    expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
  })

  it('expands 4-digit hex including alpha', () => {
    expect(parseHex('#f00f')).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseHex('#f000')).toEqual({ r: 255, g: 0, b: 0, a: 0 })
  })

  it('parses 8-digit hex alpha', () => {
    expect(parseHex('#ff000080')?.a).toBeCloseTo(128 / 255, 5)
  })

  it('tolerates a missing # and stray whitespace', () => {
    expect(parseHex('  00ff00 ')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
  })

  it('returns null rather than silently yielding black', () => {
    // The old build fell back to {0,0,0}, so every keystroke of a half-typed hex rendered
    // as black instead of being rejected.
    expect(parseHex('#')).toBeNull()
    expect(parseHex('#gg0000')).toBeNull()
    expect(parseHex('#ff00')).not.toBeNull() // 4-digit is valid
    expect(parseHex('#ff000')).toBeNull() // 5 is not
    expect(parseHex('nonsense')).toBeNull()
  })
})

describe('toHex', () => {
  it('renders 6 digits when alpha is off', () => {
    expect(toHex({ r: 255, g: 0, b: 0, a: 1 }, false)).toBe('#ff0000')
  })

  it('keeps a fixed 8-digit width when alpha is on, even at full opacity', () => {
    // The old build dropped the alpha pair whenever a >= 1, so the output flipped between
    // 7 and 9 characters depending on opacity.
    expect(toHex({ r: 255, g: 0, b: 0, a: 1 }, true)).toBe('#ff0000ff')
    expect(toHex({ r: 255, g: 0, b: 0, a: 0 }, true)).toBe('#ff000000')
  })

  it('clamps and rounds out-of-range channels', () => {
    expect(toHex({ r: 300, g: -5, b: 127.6, a: 1 }, false)).toBe('#ff0080')
  })
})

describe('rgbToHsv / hsvToRgb', () => {
  it('maps pure red', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 100, v: 100, a: 1 })
  })

  it('maps white and black', () => {
    expect(rgbToHsv({ r: 255, g: 255, b: 255, a: 1 })).toMatchObject({ s: 0, v: 100 })
    expect(rgbToHsv({ r: 0, g: 0, b: 0, a: 1 })).toMatchObject({ s: 0, v: 0 })
  })

  it('round-trips a sample of colours without drift', () => {
    for (const hex of ['#3b82f6', '#facc15', '#10b981', '#1e293b', '#ffffff', '#000000']) {
      const rgb = parseHex(hex)!
      expect(toHex(hsvToRgb(rgbToHsv(rgb)), false)).toBe(hex)
    }
  })

  it('places the visibly pure hue at the top-right of the area', () => {
    // s = 100, v = 100 is the top-right corner of the painted gradient. Under the old HSL
    // math the same corner produced l = 100 — white — for every hue.
    expect(toHex(hsvToRgb({ h: 0, s: 100, v: 100, a: 1 }), false)).toBe('#ff0000')
    expect(toHex(hsvToRgb({ h: 240, s: 100, v: 100, a: 1 }), false)).toBe('#0000ff')
  })

  it('puts black along the bottom edge and the hue ramp along the top', () => {
    expect(toHex(hsvToRgb({ h: 200, s: 50, v: 0, a: 1 }), false)).toBe('#000000')
    expect(toHex(hsvToRgb({ h: 0, s: 0, v: 100, a: 1 }), false)).toBe('#ffffff')
  })
})

describe('hsvToHsl', () => {
  it('converts the pure hue to 50% lightness', () => {
    const hsl = hsvToHsl({ h: 0, s: 100, v: 100, a: 1 })
    expect(hsl.l).toBeCloseTo(50, 5)
    expect(hsl.s).toBeCloseTo(100, 5)
  })

  it('converts white and black', () => {
    expect(hsvToHsl({ h: 0, s: 0, v: 100, a: 1 }).l).toBeCloseTo(100, 5)
    expect(hsvToHsl({ h: 0, s: 0, v: 0, a: 1 }).l).toBeCloseTo(0, 5)
  })
})

describe('formatColor', () => {
  const red = { h: 0, s: 100, v: 100, a: 1 }

  it('emits each format', () => {
    expect(formatColor(red, 'hex', false)).toBe('#ff0000')
    expect(formatColor(red, 'rgb', false)).toBe('rgb(255 0 0)')
    expect(formatColor(red, 'hsl', false)).toBe('hsl(0 100% 50%)')
  })

  it('includes alpha when enabled', () => {
    const half = { ...red, a: 0.5 }
    expect(formatColor(half, 'rgb', true)).toBe('rgb(255 0 0 / 0.5)')
    expect(formatColor(half, 'hsl', true)).toBe('hsl(0 100% 50% / 0.5)')
    expect(formatColor(half, 'hex', true)).toBe('#ff000080')
  })
})

describe('toRgbString / toHslString', () => {
  it('use the modern space-separated form', () => {
    expect(toRgbString({ r: 1, g: 2, b: 3, a: 1 }, false)).toBe('rgb(1 2 3)')
    expect(toHslString({ h: 120, s: 100, v: 100, a: 1 }, false)).toBe('hsl(120 100% 50%)')
  })
})

describe('parseColor', () => {
  it('round-trips every format the component emits', () => {
    // hsl() is serialised with integer components, so its round-trip is accurate to about
    // one 8-bit step per channel rather than exact. hex and rgb are lossless.
    for (const text of ['#3b82f6', 'rgb(59 130 246)', 'hsl(217 91% 60%)']) {
      const hsv = parseColor(text)
      expect(hsv, text).not.toBeNull()
      const rgb = hsvToRgb(hsv!)
      expect(rgb.r, text).toBeCloseTo(59, -0.5)
      expect(rgb.g, text).toBeCloseTo(130, -0.5)
      expect(rgb.b, text).toBeCloseTo(246, -0.5)
    }
  })

  it('is exact for hex and rgb', () => {
    for (const text of ['#3b82f6', 'rgb(59 130 246)']) {
      expect(toHex(hsvToRgb(parseColor(text)!), false), text).toBe('#3b82f6')
    }
  })

  it('accepts legacy comma forms and alpha', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')?.a).toBeCloseTo(0.5, 5)
    expect(parseColor('hsla(0, 100%, 50%, 50%)')?.a).toBeCloseTo(0.5, 5)
  })

  it('returns null for unparseable input', () => {
    expect(parseColor('not a colour')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('sameColor', () => {
  it('matches across notations and casing', () => {
    // The old preset check was string equality, so #FFF never matched a selected #ffffff.
    expect(sameColor('#FFF', '#ffffff')).toBe(true)
    expect(sameColor('#ff0000', 'rgb(255 0 0)')).toBe(true)
    expect(sameColor('#ff0000ff', '#ff0000')).toBe(true)
  })

  it('separates different colours and alphas', () => {
    expect(sameColor('#ff0000', '#00ff00')).toBe(false)
    expect(sameColor('#ff000080', '#ff0000')).toBe(false)
  })

  it('is false when either side is unparseable', () => {
    expect(sameColor('nope', '#ffffff')).toBe(false)
  })
})
