/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Deterministic: same seed always produces the same sequence.
 */
export function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface SeededRandom {
  next(): number
  int(min: number, max: number): number
  pick<T>(arr: T[]): T
  bool(p?: number): boolean
}

export function seededRandom(seed: number): SeededRandom {
  const rng = mulberry32(seed)
  return {
    next: () => rng(),
    int: (min, max) => Math.floor(rng() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => {
      if (arr.length === 0) throw new Error('seededRandom.pick: empty array')
      return arr[Math.floor(rng() * arr.length)] as T
    },
    bool: (p = 0.5) => rng() < p,
  }
}
