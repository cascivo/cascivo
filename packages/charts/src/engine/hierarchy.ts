export interface HierNode {
  id?: string
  label: string
  value?: number
  color?: string
  children?: HierNode[]
}

export interface PartitionedNode {
  node: HierNode
  depth: number
  /** Start/end angle in radians (0 = top, clockwise). */
  a0: number
  a1: number
  value: number
}

/** Sum a node's value bottom-up (a leaf's own value, or the sum of its children). */
export function sumValue(n: HierNode): number {
  if (n.children && n.children.length > 0) return n.children.reduce((s, c) => s + sumValue(c), 0)
  return n.value ?? 0
}

/**
 * Radial partition of a tree: each node gets an angular slice proportional to its
 * value, nested by depth. Dependency-free; the radial sibling of the squarified
 * treemap. Returns a flat list (root first) for easy rendering.
 */
export function partition(root: HierNode, fullAngle = 2 * Math.PI): PartitionedNode[] {
  const out: PartitionedNode[] = []
  const walk = (n: HierNode, depth: number, a0: number, a1: number) => {
    out.push({ node: n, depth, a0, a1, value: sumValue(n) })
    if (!n.children) return
    const span = a1 - a0
    const total = sumValue(n) || 1
    let a = a0
    for (const c of n.children) {
      const ca1 = a + (span * sumValue(c)) / total
      walk(c, depth + 1, a, ca1)
      a = ca1
    }
  }
  walk(root, 0, 0, fullAngle)
  return out
}

export function maxDepth(nodes: readonly PartitionedNode[]): number {
  return nodes.reduce((m, n) => Math.max(m, n.depth), 0)
}
