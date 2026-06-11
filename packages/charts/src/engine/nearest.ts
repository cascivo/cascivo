/** Binary search for the index of the nearest value in a sorted array. */
export function nearestIndex(values: readonly number[], target: number): number {
  if (values.length === 0) return -1
  if (values.length === 1) return 0
  let lo = 0
  let hi = values.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (values[mid]! < target) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(values[lo - 1]! - target) < Math.abs(values[lo]! - target)) return lo - 1
  return lo
}
