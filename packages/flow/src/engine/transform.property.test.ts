import * as fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { clampZoom, screenToFlow, flowToScreen } from './transform.ts'

/**
 * Property tests must be reproducible. `fc.assert` defaults to a clock-derived seed, so a
 * counterexample surfaces once in CI and vanishes on re-run — a shape that cost a real
 * diagnosis cycle in `charts/src/engine/stats.test.ts` before the underlying bugs were found
 * by hand. A fixed seed makes the suite either always pass or always fail; `numRuns` is
 * raised above the default 100 because breadth can no longer come from a varying seed.
 *
 * Enforced by `scripts/checks/property-seeds.test.ts`.
 */
const DETERMINISTIC = { seed: 0x5ca1ab1e, numRuns: 2000 } as const

const finite = (opts?: { min?: number; max?: number }) =>
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4, ...opts })

describe('clampZoom (property)', () => {
  it('always returns a value within [min, max] for finite input', () => {
    fc.assert(
      fc.property(
        finite(),
        finite({ min: 0.01, max: 100 }),
        finite({ min: 0.01, max: 100 }),
        (z, a, b) => {
          const min = Math.min(a, b)
          const max = Math.max(a, b)
          const out = clampZoom(z, min, max)
          expect(out).toBeGreaterThanOrEqual(min)
          expect(out).toBeLessThanOrEqual(max)
        },
      ),
      DETERMINISTIC,
    )
  })
})

describe('screen/flow transforms (property)', () => {
  it('screenToFlow ∘ flowToScreen is the identity (round-trips)', () => {
    fc.assert(
      fc.property(
        fc.record({ x: finite(), y: finite() }),
        fc.record({ x: finite(), y: finite(), zoom: finite({ min: 0.2, max: 2 }) }),
        (point, viewport) => {
          const back = screenToFlow(flowToScreen(point, viewport), viewport)
          expect(back.x).toBeCloseTo(point.x, 2)
          expect(back.y).toBeCloseTo(point.y, 2)
        },
      ),
      DETERMINISTIC,
    )
  })
})
