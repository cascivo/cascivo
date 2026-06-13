import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { distinguishable, oklchToSrgb, simulate, type RGB } from './cvd.ts'

function linearize(v: number): number {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function hex(r: number, g: number, b: number): RGB {
  return [linearize(r), linearize(g), linearize(b)]
}

describe('oklchToSrgb', () => {
  it('oklch(0.74 0.13 70) produces in-gamut RGB', () => {
    const rgb = oklchToSrgb(0.74, 0.13, 70)
    assert.equal(rgb.length, 3)
    for (const v of rgb) {
      assert.ok(v >= -0.01, `channel ${v} below gamut floor`)
      assert.ok(v <= 1.01, `channel ${v} above gamut ceiling`)
    }
  })

  it('oklch(1 0 0) ≈ white in linear sRGB', () => {
    const rgb = oklchToSrgb(1, 0, 0)
    for (const v of rgb) {
      assert.ok(Math.abs(v - 1) < 0.01, `expected ≈1, got ${v}`)
    }
  })

  it('oklch(0 0 0) ≈ black in linear sRGB', () => {
    const rgb = oklchToSrgb(0, 0, 0)
    for (const v of rgb) {
      assert.ok(Math.abs(v) < 0.01, `expected ≈0, got ${v}`)
    }
  })
})

describe('simulate', () => {
  it('identity check: protan simulation preserves non-red hues roughly', () => {
    // A pure blue should be largely unchanged under protan (blue channel is unaffected)
    const blue: RGB = [0, 0, 1]
    const sim = simulate(blue, 'protan')
    // The blue channel row in protan matrix: [0.01592, 0.02985, 0.95424]
    assert.ok(sim[2] > 0.9, `blue channel should be ~0.95, got ${sim[2]}`)
  })

  it('returns a 3-element array', () => {
    const sim = simulate([0.5, 0.3, 0.1], 'deutan')
    assert.equal(sim.length, 3)
  })
})

describe('distinguishable — Okabe-Ito orange vs sky-blue', () => {
  // chart-1: oklch(0.74 0.13 70)  = Okabe-Ito orange  #E69F00
  // chart-2: oklch(0.74 0.11 240) = Okabe-Ito sky-blue #56B4E9
  // This palette was designed to be distinguishable under all CVD types.
  const orange = oklchToSrgb(0.74, 0.13, 70)
  const skyblue = oklchToSrgb(0.74, 0.11, 240)

  it('distinguishable under protan', () => {
    assert.ok(distinguishable(orange, skyblue, 'protan'))
  })

  it('distinguishable under deutan', () => {
    assert.ok(distinguishable(orange, skyblue, 'deutan'))
  })

  it('distinguishable under tritan', () => {
    assert.ok(distinguishable(orange, skyblue, 'tritan'))
  })
})

describe('distinguishable — amber vs lime, a known protan confusion pair', () => {
  // #CA8A04 (amber/warm-yellow) vs #65A30D (lime-green):
  // Both map to nearly identical yellowish shades under protanopia.
  // This is a real-world protan confusion axis documented in color science.
  const amber = hex(202, 138, 4) // #CA8A04
  const lime = hex(101, 163, 13) // #65A30D

  it('NOT distinguishable under protan (confusion pair)', () => {
    assert.ok(!distinguishable(amber, lime, 'protan'))
  })

  it('distinguishable under tritan', () => {
    assert.ok(distinguishable(amber, lime, 'tritan'))
  })
})

describe('distinguishable — identical colors', () => {
  it('same color is never distinguishable', () => {
    const gray: RGB = [0.5, 0.5, 0.5]
    assert.ok(!distinguishable(gray, gray, 'protan'))
    assert.ok(!distinguishable(gray, gray, 'deutan'))
    assert.ok(!distinguishable(gray, gray, 'tritan'))
  })
})
