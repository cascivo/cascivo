import { DEFAULT_NODE_SIZE } from './types.ts'
import type { FlowEdge, FlowNode } from './types.ts'

export interface GridLayoutOptions {
  columns?: number
  gap?: number
  nodeWidth?: number
  nodeHeight?: number
}

/**
 * Arrange nodes in a simple grid. Pure — returns new nodes with computed
 * `position`s. Bring your own layout for complex graphs.
 */
export function gridLayout(nodes: FlowNode[], options: GridLayoutOptions = {}): FlowNode[] {
  const gap = options.gap ?? 40
  const w = options.nodeWidth ?? DEFAULT_NODE_SIZE.width
  const h = options.nodeHeight ?? DEFAULT_NODE_SIZE.height
  const columns = options.columns ?? Math.max(1, Math.ceil(Math.sqrt(nodes.length)))
  return nodes.map((node, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    return { ...node, position: { x: col * (w + gap), y: row * (h + gap) } }
  })
}

export interface LayeredLayoutOptions {
  /** 'LR' = left→right (default), 'TB' = top→bottom. */
  direction?: 'LR' | 'TB'
  gap?: number
  nodeWidth?: number
  nodeHeight?: number
}

/**
 * A minimal longest-path layering for DAGs (no Dagre/ELK). Each node's layer is
 * the longest path from a root; nodes share a layer along the cross axis. Pure,
 * deterministic. Documented as basic — bring your own layout for complex graphs.
 */
export function layeredLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  options: LayeredLayoutOptions = {},
): FlowNode[] {
  const direction = options.direction ?? 'LR'
  const gap = options.gap ?? 60
  const w = options.nodeWidth ?? DEFAULT_NODE_SIZE.width
  const h = options.nodeHeight ?? DEFAULT_NODE_SIZE.height

  const ids = new Set(nodes.map((n) => n.id))
  const outgoing = new Map<string, string[]>()
  const indegree = new Map<string, number>()
  for (const node of nodes) indegree.set(node.id, 0)
  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
  }

  // Kahn's algorithm: layer = longest path from any root.
  const layer = new Map<string, number>()
  let queue = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id)
  for (const id of queue) layer.set(id, 0)
  const remaining = new Map(indegree)
  while (queue.length > 0) {
    const next: string[] = []
    for (const id of queue) {
      const base = layer.get(id) ?? 0
      for (const to of outgoing.get(id) ?? []) {
        layer.set(to, Math.max(layer.get(to) ?? 0, base + 1))
        remaining.set(to, (remaining.get(to) ?? 0) - 1)
        if ((remaining.get(to) ?? 0) === 0) next.push(to)
      }
    }
    queue = next
  }
  // Any node left unassigned (cycles) lands in layer 0.
  for (const node of nodes) if (!layer.has(node.id)) layer.set(node.id, 0)

  // Stack nodes within each layer along the cross axis.
  const indexInLayer = new Map<string, number>()
  const layerCounts = new Map<number, number>()
  for (const node of nodes) {
    const l = layer.get(node.id) ?? 0
    const idx = layerCounts.get(l) ?? 0
    indexInLayer.set(node.id, idx)
    layerCounts.set(l, idx + 1)
  }

  return nodes.map((node) => {
    const l = layer.get(node.id) ?? 0
    const idx = indexInLayer.get(node.id) ?? 0
    const position =
      direction === 'LR'
        ? { x: l * (w + gap), y: idx * (h + gap) }
        : { x: idx * (w + gap), y: l * (h + gap) }
    return { ...node, position }
  })
}

export type LayoutStrategy =
  | 'grid'
  | 'layered'
  | ((nodes: FlowNode[], edges: FlowEdge[]) => FlowNode[])

/** Apply a layout strategy to nodes. */
export function applyLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  layout: LayoutStrategy,
): FlowNode[] {
  if (layout === 'grid') return gridLayout(nodes)
  if (layout === 'layered') return layeredLayout(nodes, edges)
  return layout(nodes, edges)
}
