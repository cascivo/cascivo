import type { TimingStats } from './types.ts'

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]
  return next !== undefined ? sorted[base]! + rest * (next - sorted[base]!) : sorted[base]!
}

export function summarize(values: number[]): TimingStats {
  const samples = [...values].sort((a, b) => a - b)
  const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length
  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length
  return {
    samples,
    median: quantile(samples, 0.5),
    p25: quantile(samples, 0.25),
    p75: quantile(samples, 0.75),
    mean,
    stddev: Math.sqrt(variance),
  }
}

/** Two-sided Mann-Whitney U with normal approximation and tie-averaged ranks. */
export function mannWhitneyU(a: number[], b: number[]): { u: number; p: number } {
  const all = [...a.map((v) => [v, 0] as const), ...b.map((v) => [v, 1] as const)].sort(
    (x, y) => x[0] - y[0],
  )
  const ranks = new Array<number>(all.length)
  let i = 0
  while (i < all.length) {
    let j = i
    while (j + 1 < all.length && all[j + 1]![0] === all[i]![0]) j++
    const rank = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) ranks[k] = rank
    i = j + 1
  }
  let rankSumA = 0
  all.forEach(([, group], idx) => {
    if (group === 0) rankSumA += ranks[idx]!
  })
  const n1 = a.length
  const n2 = b.length
  const u1 = rankSumA - (n1 * (n1 + 1)) / 2
  const u = Math.min(u1, n1 * n2 - u1)
  const mu = (n1 * n2) / 2
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
  if (sigma === 0) return { u, p: 1 }
  const z = (u - mu) / sigma // no continuity correction: u === mu must yield p = 1 exactly
  const p = Math.min(1, 2 * (1 - normCdf(Math.abs(z))))
  return { u, p }
}

function normCdf(x: number): number {
  // Abramowitz-Stegun erf approximation, |error| < 1.5e-7
  const t = 1 / (1 + 0.3275911 * (x / Math.SQRT2))
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-((x / Math.SQRT2) ** 2))
  return 0.5 * (1 + erf)
}
