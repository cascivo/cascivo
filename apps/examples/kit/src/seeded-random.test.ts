import { describe, it, expect } from 'vitest'
import { mulberry32, seededRandom } from './seeded-random'

describe('mulberry32', () => {
  it('produces values in [0, 1)', () => {
    const rand = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is deterministic — same seed, same sequence', () => {
    const a = mulberry32(99)
    const b = mulberry32(99)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })

  it('different seeds produce different sequences', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const av = Array.from({ length: 10 }, () => a())
    const bv = Array.from({ length: 10 }, () => b())
    expect(av).not.toEqual(bv)
  })
})

describe('seededRandom', () => {
  it('pick() throws on empty array', () => {
    const rng = seededRandom(1)
    expect(() => rng.pick([])).toThrow('seededRandom.pick: empty array')
  })
})
