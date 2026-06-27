/**
 * Downsampling for dense series — render thousands of points fast without losing
 * visual shape. `lttb` (Largest-Triangle-Three-Buckets) preserves the perceived
 * curve; `minmax` preserves spikes (keeps each bucket's extremes). Both are pure,
 * dependency-free, and no-ops when the input already fits the threshold. The chart's
 * fallback `<table>` keeps the full data, so a11y is unaffected by decimation.
 */
export type Pt = readonly [number, number]

/**
 * Largest-Triangle-Three-Buckets. Returns at most `threshold` points, always keeping
 * the first and last, choosing the point in each bucket that forms the largest
 * triangle with the previously kept point and the next bucket's average.
 */
export function lttb(points: readonly Pt[], threshold: number): Pt[] {
  const n = points.length
  if (threshold >= n || threshold < 3) return points.slice()

  const sampled: Pt[] = [points[0]!]
  const bucketSize = (n - 2) / (threshold - 2)
  let a = 0

  for (let i = 0; i < threshold - 2; i++) {
    // Average of the next bucket.
    const avgStart = Math.floor((i + 1) * bucketSize) + 1
    const avgEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n)
    const avgLen = Math.max(1, avgEnd - avgStart)
    let avgX = 0
    let avgY = 0
    for (let j = avgStart; j < avgEnd; j++) {
      avgX += points[j]![0]
      avgY += points[j]![1]
    }
    avgX /= avgLen
    avgY /= avgLen

    // Pick the current-bucket point with the largest triangle area.
    const rangeStart = Math.floor(i * bucketSize) + 1
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1
    const [ax, ay] = points[a]!
    let maxArea = -1
    let maxIdx = rangeStart
    for (let j = rangeStart; j < rangeEnd && j < n; j++) {
      const area = Math.abs((ax - avgX) * (points[j]![1] - ay) - (ax - points[j]![0]) * (avgY - ay))
      if (area > maxArea) {
        maxArea = area
        maxIdx = j
      }
    }
    sampled.push(points[maxIdx]!)
    a = maxIdx
  }

  sampled.push(points[n - 1]!)
  return sampled
}

/**
 * Min-max decimation. Splits into ~threshold/2 buckets and keeps each bucket's min and
 * max y (emitted in x order), plus the first and last point — so spikes survive.
 */
export function minmax(points: readonly Pt[], threshold: number): Pt[] {
  const n = points.length
  if (threshold >= n || threshold < 4) return points.slice()

  const bucketCount = Math.max(1, Math.floor(threshold / 2))
  const bucketSize = n / bucketCount
  const out: Pt[] = [points[0]!]

  for (let b = 0; b < bucketCount; b++) {
    const start = Math.floor(b * bucketSize)
    const end = Math.min(n, Math.floor((b + 1) * bucketSize))
    if (end <= start) continue
    let minP = points[start]!
    let maxP = points[start]!
    for (let j = start; j < end; j++) {
      if (points[j]![1] < minP[1]) minP = points[j]!
      if (points[j]![1] > maxP[1]) maxP = points[j]!
    }
    // Emit in x order so the line stays monotonic in x.
    if (minP[0] <= maxP[0]) {
      out.push(minP)
      if (maxP !== minP) out.push(maxP)
    } else {
      out.push(maxP)
      out.push(minP)
    }
  }

  out.push(points[n - 1]!)
  return out
}

export type DecimateMethod = 'lttb' | 'minmax'

/** Decimate with the chosen method (default LTTB); no-op below the threshold. */
export function decimate(
  points: readonly Pt[],
  threshold: number,
  method: DecimateMethod = 'lttb',
): Pt[] {
  return method === 'minmax' ? minmax(points, threshold) : lttb(points, threshold)
}
