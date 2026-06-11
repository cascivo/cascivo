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
  const bins: Bin[] = Array.from({ length: k }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    count: 0,
  }))

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / width), k - 1)
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
