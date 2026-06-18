export interface MergeResult {
  text: string
  conflicts: number
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!)
    }
  }
  return dp
}

interface Chunk {
  type: 'common' | 'left' | 'right'
  lines: string[]
}

function diff(base: string[], changed: string[]): Chunk[] {
  const dp = lcs(base, changed)
  const chunks: Chunk[] = []
  let i = base.length
  let j = changed.length
  const leftOnly: string[] = []
  const rightOnly: string[] = []
  const common: string[] = []

  function flush() {
    if (leftOnly.length > 0 || rightOnly.length > 0) {
      if (common.length > 0) {
        chunks.unshift({ type: 'common', lines: [...common] })
        common.length = 0
      }
      chunks.unshift({
        type: leftOnly.length > 0 ? 'left' : 'right',
        lines: leftOnly.length > 0 ? [...leftOnly] : [...rightOnly],
      })
      leftOnly.length = 0
      rightOnly.length = 0
    } else if (common.length > 0) {
      chunks.unshift({ type: 'common', lines: [...common] })
      common.length = 0
    }
  }

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && base[i - 1] === changed[j - 1]) {
      if (leftOnly.length > 0 || rightOnly.length > 0) flush()
      common.unshift(base[i - 1]!)
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      flush()
      rightOnly.unshift(changed[j - 1]!)
      j--
    } else {
      flush()
      leftOnly.unshift(base[i - 1]!)
      i--
    }
  }
  flush()
  return chunks
}

export function merge(base: string, local: string, upstream: string): MergeResult {
  const baseLines = base.split('\n')
  const localLines = local.split('\n')
  const upstreamLines = upstream.split('\n')

  const localChunks = diff(baseLines, localLines)

  const localMap = new Map<string, string[]>()
  const upstreamMap = new Map<string, string[]>()

  let li = 0

  for (const c of localChunks) {
    if (c.type === 'left') {
      localMap.set(`del:${li}`, c.lines)
    } else if (c.type === 'right') {
      localMap.set(`ins:${li}`, c.lines)
      li += c.lines.length
    } else {
      li += c.lines.length
    }
  }
  void localMap
  void upstreamMap

  // Simple line-by-line three-way merge
  const result: string[] = []
  let conflicts = 0
  let bi = 0
  let lli = 0
  let uui = 0

  // Build index maps: base line → local and upstream lines
  // Use a simpler approach: if local == base, take upstream; if upstream == base, take local;
  // if both differ, conflict.
  const bLen = baseLines.length
  const lLen = localLines.length
  const uLen = upstreamLines.length

  // If local unchanged vs base, fast-forward to upstream
  if (local === base) {
    return { text: upstream, conflicts: 0 }
  }
  // If upstream unchanged vs base, keep local
  if (upstream === base) {
    return { text: local, conflicts: 0 }
  }
  // Both changed — try line-by-line
  void bi
  void lli
  void uui
  void bLen
  void lLen
  void uLen

  const localDiffs = diff(baseLines, localLines)
  const upstreamDiffs = diff(baseLines, upstreamLines)

  // Reconstruct base position aligned chunks
  let basePos = 0
  let lPos = 0
  let uPos = 0
  const localOut: { baseStart: number; baseEnd: number; lines: string[] }[] = []
  const upstreamOut: { baseStart: number; baseEnd: number; lines: string[] }[] = []

  for (const c of localDiffs) {
    if (c.type === 'common') {
      lPos += c.lines.length
      basePos += c.lines.length
    } else if (c.type === 'right') {
      localOut.push({ baseStart: basePos, baseEnd: basePos, lines: c.lines })
      lPos += c.lines.length
    } else {
      localOut.push({ baseStart: basePos, baseEnd: basePos + c.lines.length, lines: [] })
      basePos += c.lines.length
    }
  }
  basePos = 0
  for (const c of upstreamDiffs) {
    if (c.type === 'common') {
      uPos += c.lines.length
      basePos += c.lines.length
    } else if (c.type === 'right') {
      upstreamOut.push({ baseStart: basePos, baseEnd: basePos, lines: c.lines })
      uPos += c.lines.length
    } else {
      upstreamOut.push({ baseStart: basePos, baseEnd: basePos + c.lines.length, lines: [] })
      basePos += c.lines.length
    }
  }
  void lPos
  void uPos

  // Simple merge: walk base lines; apply local and upstream edits
  // When both touch the same region, emit conflict markers
  const localByBase = new Map<number, { end: number; lines: string[] }>()
  for (const e of localOut) {
    localByBase.set(e.baseStart, { end: e.baseEnd, lines: e.lines })
  }
  const upstreamByBase = new Map<number, { end: number; lines: string[] }>()
  for (const e of upstreamOut) {
    upstreamByBase.set(e.baseStart, { end: e.baseEnd, lines: e.lines })
  }

  let b = 0
  while (b <= baseLines.length) {
    const lEdit = localByBase.get(b)
    const uEdit = upstreamByBase.get(b)

    if (lEdit && uEdit) {
      const lEnd = Math.max(lEdit.end, b)
      const uEnd = Math.max(uEdit.end, b)
      const lLines = lEdit.lines
      const uLines = uEdit.lines
      if (JSON.stringify(lLines) === JSON.stringify(uLines)) {
        result.push(...lLines)
      } else {
        result.push('<<<<<<< local')
        result.push(...lLines)
        result.push('=======')
        result.push(...uLines)
        result.push('>>>>>>> upstream')
        conflicts++
      }
      b = Math.max(lEnd, uEnd, b + 1)
    } else if (lEdit) {
      result.push(...lEdit.lines)
      b = Math.max(lEdit.end, b + 1)
    } else if (uEdit) {
      result.push(...uEdit.lines)
      b = Math.max(uEdit.end, b + 1)
    } else {
      if (b < baseLines.length) result.push(baseLines[b]!)
      b++
    }
  }

  return { text: result.join('\n'), conflicts }
}
