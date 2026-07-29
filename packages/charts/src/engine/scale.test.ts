import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { bandScale, linearScale, niceTicks } from './scale'

describe('linearScale', () => {
  it('maps domain to range linearly', () => {
    const s = linearScale([0, 100], [0, 500])
    expect(s.map(0)).toBe(0)
    expect(s.map(50)).toBe(250)
    expect(s.map(100)).toBe(500)
  })

  it('handles inverted ranges (y axes)', () => {
    const s = linearScale([0, 10], [300, 0])
    expect(s.map(0)).toBe(300)
    expect(s.map(10)).toBe(0)
  })

  it('degenerate domain maps to range start', () => {
    const s = linearScale([5, 5], [0, 100])
    expect(s.map(5)).toBe(0)
  })

  it('invert is the inverse of map', () => {
    const s = linearScale([0, 100], [0, 500])
    expect(s.invert(s.map(42))).toBeCloseTo(42)
  })
})

describe('niceTicks', () => {
  it('produces round steps for 0-100', () => {
    const ticks = niceTicks(0, 100, 5)
    // rawStep = 20, step = 20 (mantissa 2 × 10^1)
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100])
  })

  it('produces round steps for small ranges', () => {
    const ticks = niceTicks(0, 0.1, 5)
    ticks.forEach((t, i) => {
      if (i > 0) expect(t).toBeGreaterThan(ticks[i - 1]!)
    })
  })

  // The 2026-07-28 report's exact reproduction table (C17a). `yTicks` reads like "how
  // many labels" but is a d3-style density HINT, so requesting a density finer than the
  // data's own unit used to subdivide into fractions instead of clamping — the case an
  // incident-count chart (a handful of severities, 0–3 each) hits constantly. The
  // reporter's own workaround, `yTicks={max + 1}`, landed straight on it at max=1.
  describe('integer domains never yield fractional ticks (C17a)', () => {
    const cases: [number, number, number[]][] = [
      // [domain max, requested count, expected ticks] — all previously listed as broken
      [1, 1, [0, 1]],
      [1, 2, [0, 1]], // was [0, 0.5, 1]
      [1, 5, [0, 1]], // was [0, 0.2, 0.4, 0.6, 0.8, 1]
      [2, 2, [0, 1, 2]],
      [2, 5, [0, 1, 2]], // was [0, 0.5, 1, 1.5, 2]
      [6, 6, [0, 1, 2, 3, 4, 5, 6]],
      // These were already clean and must stay byte-identical — the fix must not move
      // the library's existing nice-step selection on domains it already handled well.
      [7, 5, [0, 2, 4, 6]],
      [20, 5, [0, 5, 10, 15, 20]],
      [34, 6, [0, 10, 20, 30]],
    ]
    for (const [max, count, expected] of cases) {
      it(`domain [0, ${max}] at count ${count} -> ${JSON.stringify(expected)}`, () => {
        expect(niceTicks(0, max, count)).toEqual(expected)
      })
    }

    it('never returns a non-integer for an integer domain', () => {
      for (let max = 1; max <= 40; max++) {
        for (let count = 1; count <= 12; count++) {
          for (const tick of niceTicks(0, max, count)) {
            expect(Number.isInteger(tick)).toBe(true)
          }
        }
      }
    })

    it('the naive workaround yTicks={max + 1} is now safe at every small max', () => {
      for (let max = 1; max <= 10; max++) {
        expect(niceTicks(0, max, max + 1).every(Number.isInteger)).toBe(true)
      }
    })
  })

  describe('allowDecimals overrides the auto-detection', () => {
    it('allowDecimals: true restores fractional steps on an integer domain', () => {
      expect(niceTicks(0, 1, 5, true)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    })

    it('allowDecimals: false clamps a fractional domain to integer steps', () => {
      expect(niceTicks(0, 2.5, 5, false).every(Number.isInteger)).toBe(true)
    })

    it('a fractional domain still subdivides by default', () => {
      // Auto-detection keys off the BOUNDS, so continuous data is untouched.
      const ticks = niceTicks(0, 0.5, 5)
      expect(ticks.some((t) => !Number.isInteger(t))).toBe(true)
    })
  })

  it('property: sorted, within padded domain, nice steps', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1e-3, max: 1e6, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 2, max: 12 }),
        (start, span, count) => {
          const ticks = niceTicks(start, start + span, count)
          expect(ticks.length).toBeGreaterThanOrEqual(1)
          expect(ticks.length).toBeLessThanOrEqual(count * 2 + 2)
          for (let i = 1; i < ticks.length; i++) expect(ticks[i]!).toBeGreaterThan(ticks[i - 1]!)
          if (ticks.length >= 2) {
            const step = ticks[1]! - ticks[0]!
            if (step > 0) {
              const magnitude = 10 ** Math.floor(Math.log10(step))
              const mantissa = step / magnitude
              // Use relative tolerance: float subtraction of large adjacent ticks loses ~5 ULPs
              expect([1, 2, 2.5, 5, 10].some((m) => Math.abs(mantissa - m) / m < 1e-4)).toBe(true)
            }
          }
        },
      ),
    )
  })
})

describe('bandScale', () => {
  it('positions bands in order', () => {
    const s = bandScale(['a', 'b', 'c'], [0, 300], 0.1)
    expect(s.map('a')!).toBeLessThan(s.map('b')!)
    expect(s.map('b')!).toBeLessThan(s.map('c')!)
  })

  it('returns undefined for unknown values', () => {
    const s = bandScale(['a', 'b'], [0, 100], 0.1)
    expect(s.map('x' as never)).toBeUndefined()
  })

  it('bandwidth is positive', () => {
    const s = bandScale(['a', 'b', 'c'], [0, 300], 0.1)
    expect(s.bandwidth).toBeGreaterThan(0)
  })
})
