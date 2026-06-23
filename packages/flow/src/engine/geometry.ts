import { clampZoom } from './transform.ts'
import { DEFAULT_NODE_SIZE } from './types.ts'
import type { FlowNode, HandlePosition, NodeSize, Viewport, XYPosition } from './types.ts'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

/** The effective size of a node (explicit/measured, else the default footprint). */
export function nodeSize(node: FlowNode): NodeSize {
  return {
    width: node.width ?? DEFAULT_NODE_SIZE.width,
    height: node.height ?? DEFAULT_NODE_SIZE.height,
  }
}

/** The node's bounding rectangle in flow coordinates. */
export function nodeBounds(node: FlowNode): Rect {
  const { width, height } = nodeSize(node)
  return { x: node.position.x, y: node.position.y, width, height }
}

/** The `{x,y}` (flow coords) where an edge attaches for a given handle position. */
export function handleAnchor(node: FlowNode, position: HandlePosition): XYPosition {
  const { x, y, width, height } = nodeBounds(node)
  switch (position) {
    case 'top':
      return { x: x + width / 2, y }
    case 'right':
      return { x: x + width, y: y + height / 2 }
    case 'bottom':
      return { x: x + width / 2, y: y + height }
    case 'left':
      return { x, y: y + height / 2 }
  }
}

/** Bounding box (flow coords) enclosing all nodes — the input to fit-view. */
export function graphBounds(nodes: readonly FlowNode[]): Rect | null {
  if (nodes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const node of nodes) {
    const b = nodeBounds(node)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export interface FitViewportOptions {
  /** Fractional padding around the graph (0.1 = 10% on each side). */
  padding?: number
  minZoom?: number
  maxZoom?: number
}

/**
 * Compute the `viewport` (x/y/zoom) that frames `bounds` inside a container of
 * `container` size, with padding. Pure math — testable with injected sizes.
 */
export function fitViewport(
  bounds: Rect,
  container: Size,
  options: FitViewportOptions = {},
): Viewport {
  const { padding = 0.1, minZoom = 0.2, maxZoom = 2 } = options
  if (bounds.width <= 0 || bounds.height <= 0 || container.width <= 0 || container.height <= 0) {
    return { x: container.width / 2 - bounds.x, y: container.height / 2 - bounds.y, zoom: 1 }
  }
  const scaleX = container.width / (bounds.width * (1 + padding * 2))
  const scaleY = container.height / (bounds.height * (1 + padding * 2))
  const zoom = clampZoom(Math.min(scaleX, scaleY), minZoom, maxZoom)
  const x = container.width / 2 - (bounds.x + bounds.width / 2) * zoom
  const y = container.height / 2 - (bounds.y + bounds.height / 2) * zoom
  return { x, y, zoom }
}
