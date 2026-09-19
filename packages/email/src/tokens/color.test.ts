/**
 * Reference values for the OKLCh → sRGB pipeline.
 *
 * The whole email target rests on this conversion being right: every colour in every
 * template is produced by it, and a hue shift here is invisible in code review and
 * obvious in an inbox. The primary anchors are the three sRGB corners, whose OKLCh
 * coordinates are fixed points of the transform — if `red` does not come back `#f00`,
 * the matrices are wrong rather than merely imprecise.
 */
import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  flatten,
  luminance,
  mixOklch,
  oklchToRgb,
  rgbToOklch,
  toHex,
} from './color.ts'

const WHITE = oklchToRgb(1, 0, 0)
const BLACK = oklchToRgb(0, 0, 0)

describe('oklchToRgb', () => {
  it('round-trips the sRGB primaries exactly', () => {
    expect(toHex(oklchToRgb(0.62796, 0.25768, 29.234))).toBe('#f00')
    expect(toHex(oklchToRgb(0.86644, 0.29483, 142.495))).toBe('#0f0')
    expect(toHex(oklchToRgb(0.45201, 0.31321, 264.052))).toBe('#00f')
  })

  it('maps the achromatic extremes without chroma noise', () => {
    expect(toHex(WHITE)).toBe('#fff')
    expect(toHex(BLACK)).toBe('#000')
  })

  it('resolves a real cascivo primitive to its documented value', () => {
    // --cascivo-gray-200, packages/tokens/src/index.css
    expect(toHex(oklchToRgb(0.928, 0.006, 264))).toBe('#e5e7eb')
  })

  it('preserves hue when gamut-mapping an out-of-sRGB colour', () => {
    // Chroma 0.4 at this lightness is well outside sRGB. Naive per-channel clipping
    // would drag the hue; §13.2 chroma reduction must not.
    const mapped = oklchToRgb(0.7, 0.4, 320)
    const { h } = rgbToOklch(mapped)
    expect(Math.abs(h - 320)).toBeLessThan(2)
  })

  it('clamps lightness beyond the unit interval to the achromatic extremes', () => {
    expect(toHex(oklchToRgb(1.4, 0.1, 200))).toBe('#fff')
    expect(toHex(oklchToRgb(-0.2, 0.1, 200))).toBe('#000')
  })
})

describe('toHex', () => {
  it('shortens to three digits only when lossless', () => {
    expect(toHex({ r: 255, g: 255, b: 255, alpha: 1 })).toBe('#fff')
    expect(toHex({ r: 229, g: 231, b: 235, alpha: 1 })).toBe('#e5e7eb')
  })

  it('falls back to rgba() for a translucent colour', () => {
    expect(toHex({ r: 0, g: 0, b: 0, alpha: 0.5 })).toBe('rgba(0, 0, 0, 0.5)')
  })
})

describe('mixOklch', () => {
  it('mixing with transparent keeps the hue and only drops alpha', () => {
    const accent = oklchToRgb(0.52, 0.2, 250)
    const mixed = mixOklch(accent, { r: 0, g: 0, b: 0, alpha: 0 }, 0.55)
    expect(mixed.alpha).toBeCloseTo(0.55, 3)
    expect(toHex({ ...mixed, alpha: 1 })).toBe(toHex(accent))
  })

  it('a full-weight mix is the source colour', () => {
    const accent = oklchToRgb(0.52, 0.2, 250)
    expect(toHex(mixOklch(accent, WHITE, 1))).toBe(toHex(accent))
  })
})

describe('flatten', () => {
  it('composites in linear light, not gamma space', () => {
    // A 50% black over white is #bcbcbc in linear light; averaging gamma-encoded
    // channels would give the visibly darker #808080.
    const half = flatten({ r: 0, g: 0, b: 0, alpha: 0.5 }, WHITE)
    expect(toHex(half)).toBe('#bcbcbc')
  })

  it('leaves an opaque colour untouched', () => {
    const accent = oklchToRgb(0.52, 0.2, 250)
    expect(toHex(flatten(accent, WHITE))).toBe(toHex(accent))
  })
})

describe('contrastRatio', () => {
  it('anchors on the WCAG extremes', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 2)
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    const accent = oklchToRgb(0.52, 0.2, 250)
    expect(contrastRatio(accent, WHITE)).toBeCloseTo(contrastRatio(WHITE, accent), 10)
  })

  it('agrees with the published luminance of mid grey', () => {
    expect(luminance({ r: 128, g: 128, b: 128, alpha: 1 })).toBeCloseTo(0.2159, 3)
  })
})
