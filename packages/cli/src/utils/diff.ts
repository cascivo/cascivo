/**
 * Minimal line-based diff (LCS) rendered in a unified-ish format. Zero deps —
 * good enough to preview what `cascade update` will change.
 */
export function diffLines(oldStr: string, newStr: string): string[] {
  const a = oldStr.split('\n')
  const b = newStr.split('\n')
  const n = a.length
  const m = b.length

  // LCS length table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  )
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
    }
  }

  const out: string[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push(`  ${a[i]}`)
      i++
      j++
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      out.push(`- ${a[i]}`)
      i++
    } else {
      out.push(`+ ${b[j]}`)
      j++
    }
  }
  while (i < n) out.push(`- ${a[i++]}`)
  while (j < m) out.push(`+ ${b[j++]}`)
  return out
}

/** True when the two strings differ. */
export function hasChanges(oldStr: string, newStr: string): boolean {
  return oldStr !== newStr
}
