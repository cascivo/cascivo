export interface SankeyNode {
  id: string
  label: string
  color?: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface LaidNode extends SankeyNode {
  rank: number
  value: number
  x0: number
  x1: number
  y0: number
  y1: number
}

export interface LaidLink {
  source: LaidNode
  target: LaidNode
  value: number
  /** Y at the source's right edge and target's left edge (band centers' tops). */
  sy: number
  ty: number
  width: number
}

export interface SankeyLayout {
  nodes: LaidNode[]
  links: LaidLink[]
}

export interface SankeyOptions {
  width: number
  height: number
  nodeWidth?: number
  nodePadding?: number
}

/**
 * A dependency-free Sankey layout: rank nodes by longest path from a source,
 * stack them within each rank sized by throughput, and route links as ribbons.
 * No crossing-minimization sweep (stable input order) — good for the common
 * small/medium flow diagram.
 */
export function sankeyLayout(
  nodes: readonly SankeyNode[],
  links: readonly SankeyLink[],
  { width, height, nodeWidth = 16, nodePadding = 12 }: SankeyOptions,
): SankeyLayout {
  const byId = new Map<string, LaidNode>()
  for (const n of nodes) {
    byId.set(n.id, { ...n, rank: 0, value: 0, x0: 0, x1: 0, y0: 0, y1: 0 })
  }
  const valid = links.filter((l) => byId.has(l.source) && byId.has(l.target))

  // Rank = longest path from a source (relax until stable).
  const incoming = new Map<string, SankeyLink[]>()
  for (const l of valid) {
    if (!incoming.has(l.target)) incoming.set(l.target, [])
    incoming.get(l.target)!.push(l)
  }
  let changed = true
  let guard = 0
  while (changed && guard++ < nodes.length + 1) {
    changed = false
    for (const l of valid) {
      const s = byId.get(l.source)!
      const t = byId.get(l.target)!
      if (t.rank < s.rank + 1) {
        t.rank = s.rank + 1
        changed = true
      }
    }
  }
  const maxRank = nodes.length ? Math.max(...[...byId.values()].map((n) => n.rank)) : 0

  // Node throughput = max(sum in, sum out).
  for (const n of byId.values()) {
    const inSum = valid.filter((l) => l.target === n.id).reduce((s, l) => s + l.value, 0)
    const outSum = valid.filter((l) => l.source === n.id).reduce((s, l) => s + l.value, 0)
    n.value = Math.max(inSum, outSum, 0)
  }

  // Vertical scale: the fullest rank determines value→pixel.
  const ranks: LaidNode[][] = Array.from({ length: maxRank + 1 }, () => [])
  for (const n of byId.values()) ranks[n.rank]!.push(n)
  let maxRankValue = 1
  for (const col of ranks) {
    const sum = col.reduce((s, n) => s + n.value, 0)
    const avail = height - nodePadding * Math.max(0, col.length - 1)
    if (sum > 0) maxRankValue = Math.max(maxRankValue, sum / Math.max(1, avail))
  }
  const valueToPx = (v: number) => v / maxRankValue

  // Position nodes: x by rank, y stacked within rank.
  const colWidth = maxRank > 0 ? (width - nodeWidth) / maxRank : 0
  for (let r = 0; r <= maxRank; r++) {
    const col = ranks[r]!
    const totalH =
      col.reduce((s, n) => s + valueToPx(n.value), 0) + nodePadding * Math.max(0, col.length - 1)
    let y = Math.max(0, (height - totalH) / 2)
    for (const n of col) {
      n.x0 = r * colWidth
      n.x1 = n.x0 + nodeWidth
      n.y0 = y
      n.y1 = y + valueToPx(n.value)
      y = n.y1 + nodePadding
    }
  }

  // Route links: stack at each node's source/target edge.
  const srcOffset = new Map<string, number>()
  const tgtOffset = new Map<string, number>()
  const laidLinks: LaidLink[] = valid.map((l) => {
    const source = byId.get(l.source)!
    const target = byId.get(l.target)!
    const w = valueToPx(l.value)
    const sy = source.y0 + (srcOffset.get(source.id) ?? 0)
    const ty = target.y0 + (tgtOffset.get(target.id) ?? 0)
    srcOffset.set(source.id, (srcOffset.get(source.id) ?? 0) + w)
    tgtOffset.set(target.id, (tgtOffset.get(target.id) ?? 0) + w)
    return { source, target, value: l.value, sy, ty, width: w }
  })

  return { nodes: [...byId.values()], links: laidLinks }
}

/** Cubic ribbon path for one link (a filled band from source edge to target edge). */
export function linkPath(l: LaidLink): string {
  const x0 = l.source.x1
  const x1 = l.target.x0
  const xc = (x0 + x1) / 2
  const sy0 = l.sy
  const sy1 = l.sy + l.width
  const ty0 = l.ty
  const ty1 = l.ty + l.width
  return (
    `M${x0},${sy0}` +
    `C${xc},${sy0} ${xc},${ty0} ${x1},${ty0}` +
    `L${x1},${ty1}` +
    `C${xc},${ty1} ${xc},${sy1} ${x0},${sy1}` +
    `Z`
  )
}
