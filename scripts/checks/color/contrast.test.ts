import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { contrastRatio, parseOklch, relativeLuminance } from './contrast.ts'
import type { RGB } from './contrast.ts'

const BLACK: RGB = [0, 0, 0]
const WHITE: RGB = [1, 1, 1]

describe('relativeLuminance', () => {
  it('black = 0', () => {
    assert.equal(relativeLuminance(BLACK), 0)
  })

  it('white = 1', () => {
    assert.equal(relativeLuminance(WHITE), 1)
  })
})

describe('contrastRatio', () => {
  it('black vs white ≥ 21', () => {
    const ratio = contrastRatio(BLACK, WHITE)
    assert.ok(ratio >= 21, `expected ≥ 21, got ${ratio}`)
  })

  it('white vs white = 1', () => {
    const ratio = contrastRatio(WHITE, WHITE)
    assert.ok(Math.abs(ratio - 1) < 0.0001, `expected 1, got ${ratio}`)
  })

  it('black vs white equals white vs black (commutative)', () => {
    const r1 = contrastRatio(BLACK, WHITE)
    const r2 = contrastRatio(WHITE, BLACK)
    assert.ok(Math.abs(r1 - r2) < 0.0001)
  })

  it('ratio is always ≥ 1', () => {
    const gray: RGB = [0.3, 0.3, 0.3]
    assert.ok(contrastRatio(BLACK, gray) >= 1)
    assert.ok(contrastRatio(gray, WHITE) >= 1)
  })
})

describe('parseOklch', () => {
  it('oklch(0.74 0.13 70) returns in-gamut RGB', () => {
    const rgb = parseOklch('oklch(0.74 0.13 70)')
    assert.equal(rgb.length, 3)
    for (const v of rgb) {
      assert.ok(v >= -0.01, `channel ${v} below gamut floor`)
      assert.ok(v <= 1.01, `channel ${v} above gamut ceiling`)
    }
  })

  it('oklch(0 0 0) parses to near-black', () => {
    const rgb = parseOklch('oklch(0 0 0)')
    for (const v of rgb) {
      assert.ok(Math.abs(v) < 0.01, `expected ≈0, got ${v}`)
    }
  })

  it('oklch(1 0 0) parses to near-white', () => {
    const rgb = parseOklch('oklch(1 0 0)')
    for (const v of rgb) {
      assert.ok(Math.abs(v - 1) < 0.01, `expected ≈1, got ${v}`)
    }
  })

  it('throws on invalid input', () => {
    assert.throws(() => parseOklch('rgb(255 0 0)'), /parseOklch/)
  })
})
