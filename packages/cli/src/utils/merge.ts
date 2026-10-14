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

/** One side's change to the base: base lines [start, end) become `lines`. */
interface Hunk {
  start: number
  end: number
  lines: string[]
}

/** A side's diff against the base as hunks; adjacent deletions and insertions are one hunk. */
function hunks(base: string[], changed: string[]): Hunk[] {
  const out: Hunk[] = []
  let pos = 0
  let open: Hunk | undefined
  for (const chunk of diff(base, changed)) {
    if (chunk.type === 'common') {
      pos += chunk.lines.length
      open = undefined
      continue
    }
    if (!open) {
      open = { start: pos, end: pos, lines: [] }
      out.push(open)
    }
    if (chunk.type === 'left') {
      open.end += chunk.lines.length
      pos += chunk.lines.length
    } else {
      open.lines.push(...chunk.lines)
    }
  }
  return out
}

/** Base lines [start, end) with a side's hunks (all inside that range) applied. */
function apply(base: string[], start: number, end: number, edits: Hunk[]): string[] {
  const out: string[] = []
  let pos = start
  for (const h of edits) {
    out.push(...base.slice(pos, h.start), ...h.lines)
    pos = h.end
  }
  out.push(...base.slice(pos, end))
  return out
}

/**
 * Three-way merge by line (diff3). Each side's changes against the base are grouped into
 * regions of overlapping hunks; two insertions at the same point overlap too. A region only
 * one side changed takes that side; one both changed identically takes it once; anything else
 * is a conflict, marked the way git marks it.
 */
export function merge(base: string, local: string, upstream: string): MergeResult {
  if (local === base) return { text: upstream, conflicts: 0 }
  if (upstream === base || local === upstream) return { text: local, conflicts: 0 }

  const baseLines = base.split('\n')
  const ours = hunks(baseLines, local.split('\n'))
  const theirs = hunks(baseLines, upstream.split('\n'))
  const result: string[] = []
  let conflicts = 0
  let pos = 0
  let i = 0
  let j = 0

  while (i < ours.length || j < theirs.length) {
    const start = Math.min(ours[i]?.start ?? Infinity, theirs[j]?.start ?? Infinity)
    result.push(...baseLines.slice(pos, start))
    let end = start
    const mine: Hunk[] = []
    const yours: Hunk[] = []
    const overlaps = (h: Hunk | undefined): h is Hunk =>
      h !== undefined && (h.start < end || h.start === start)
    for (let grew = true; grew;) {
      grew = false
      while (overlaps(ours[i])) {
        end = Math.max(end, ours[i]!.end)
        mine.push(ours[i++]!)
        grew = true
      }
      while (overlaps(theirs[j])) {
        end = Math.max(end, theirs[j]!.end)
        yours.push(theirs[j++]!)
        grew = true
      }
    }
    const localText = apply(baseLines, start, end, mine)
    const upstreamText = apply(baseLines, start, end, yours)
    if (yours.length === 0) result.push(...localText)
    else if (mine.length === 0) result.push(...upstreamText)
    else if (localText.join('\n') === upstreamText.join('\n')) result.push(...localText)
    else {
      result.push('<<<<<<< local', ...localText, '=======', ...upstreamText, '>>>>>>> upstream')
      conflicts++
    }
    pos = end
  }
  result.push(...baseLines.slice(pos))
  return { text: result.join('\n'), conflicts }
}
