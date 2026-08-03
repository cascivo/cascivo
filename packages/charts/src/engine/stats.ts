/** Statistical helpers for histogram and boxplot charts. */

export interface Bin {
  x0: number
  x1: number
  count: number
}

/** Interquartile range */
function iqr(sorted: readonly number[]): number {
  const n = sorted.length
  const q1 = sorted[Math.floor(n * 0.25)] ?? 0
  const q3 = sorted[Math.floor(n * 0.75)] ?? 0
  return q3 - q1
}

/**
 * Freedman–Diaconis bin width with sane fallbacks.
 * Returns inclusive-exclusive bins covering [min, max].
 */
export function binValues(values: readonly number[], binCount?: number): Bin[] {
  if (values.length === 0) return []

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const min = sorted[0] ?? 0
  const max = sorted[n - 1] ?? 0

  if (min === max) {
    return [{ x0: min, x1: min + 1, count: n }]
  }

  let k: number
  if (binCount !== undefined && binCount > 0) {
    k = binCount
  } else {
    // Freedman–Diaconis: h = 2 * IQR * n^(-1/3)
    const h = 2 * iqr(sorted) * n ** (-1 / 3)
    k = h > 0 ? Math.ceil((max - min) / h) : Math.ceil(Math.sqrt(n))
    k = Math.max(1, Math.min(k, 200))
  }

  const width = (max - min) / k

  // A range too narrow to divide `k` ways collapses to one bin rather than `k` degenerate
  // ones. `binValues([0, 5e-324], 200)` used to underflow `width` to 0, which made every
  // boundary identical, sent `(v - min) / width` to `0/0 = NaN` for `v === min`, and dropped
  // that value's count entirely — 1 of 2 values counted, silently.
  if (!Number.isFinite(width) || width <= 0) {
    return [{ x0: min, x1: max, count: n }]
  }

  const bins: Bin[] = Array.from({ length: k }, (_, i) => ({
    x0: min + i * width,
    // Pin the final edge to `max` instead of accumulating to `min + k * width`, which lands
    // short of `max` by up to a few ulps — and by *more* than the caller can compensate for
    // at subnormal scales, where a relative epsilon underflows to zero. Bins now cover
    // [min, max] exactly, so the contract is testable without a tolerance.
    x1: i === k - 1 ? max : min + (i + 1) * width,
    count: 0,
  }))

  for (const v of values) {
    const raw = Math.floor((v - min) / width)
    // `raw` is NaN only if `width` is non-finite, which is excluded above; clamp anyway so a
    // future change cannot reintroduce a lost count through an out-of-range index.
    const idx = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), k - 1) : k - 1
    const bin = bins[idx]
    if (bin) bin.count++
  }

  return bins
}

export interface BoxStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

/** Five-number summary with outlier detection via 1.5×IQR fences. */
export function boxStats(values: readonly number[]): BoxStats {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  const median = (arr: readonly number[]): number => {
    const mid = Math.floor(arr.length / 2)
    return arr.length % 2 === 0 ? ((arr[mid - 1] ?? 0) + (arr[mid] ?? 0)) / 2 : (arr[mid] ?? 0)
  }

  const q1 = median(sorted.slice(0, Math.floor(n / 2)))
  const q3 = median(sorted.slice(Math.ceil(n / 2)))
  const med = median(sorted)
  const range = q3 - q1
  const lo = q1 - 1.5 * range
  const hi = q3 + 1.5 * range

  const inliers = sorted.filter((v) => v >= lo && v <= hi)
  const outliers = sorted.filter((v) => v < lo || v > hi)

  return {
    min: inliers[0] ?? sorted[0] ?? 0,
    q1,
    median: med,
    q3,
    max: inliers[inliers.length - 1] ?? sorted[n - 1] ?? 0,
    outliers,
  }
}

/** [min, max] extent of an array of numbers. */
export function extent(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1]
  let min = values[0] ?? 0
  let max = values[0] ?? 0
  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return [min, max]
}
