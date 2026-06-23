/** Shared geometry + graph types for the flow engine. */

export interface XYPosition {
  x: number
  y: number
}

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left'

export interface NodeSize {
  width: number
  height: number
}

/** A graph node. Positioned in flow coordinates; renders as themed HTML. */
export interface FlowNode<Data = Record<string, unknown>> {
  id: string
  position: XYPosition
  data?: Data
  /** Custom renderer key resolved via `nodeTypes`. */
  type?: string
  selected?: boolean
  /** Explicit/measured size used for handle anchors + bounding boxes. */
  width?: number
  height?: number
}

export type EdgePathType = 'bezier' | 'straight' | 'smoothstep'

/** A directed connection between two nodes' handles. */
export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  /** Custom renderer key resolved via `edgeTypes`. */
  type?: EdgePathType | string
  animated?: boolean
  label?: string
  selected?: boolean
  /** Arrowhead at the source end (points back toward the source). Default false. */
  markerStart?: boolean
  /** Arrowhead at the target end (points at the target). Default true. */
  markerEnd?: boolean
}

/** The pan/zoom state of the canvas pane. */
export interface Viewport {
  x: number
  y: number
  zoom: number
}

/** A new connection produced by interactive connect. */
export interface Connection {
  source: string
  target: string
  sourceHandle?: string | undefined
  targetHandle?: string | undefined
}

/** Default node footprint when a node has no explicit/measured size. */
export const DEFAULT_NODE_SIZE: NodeSize = { width: 150, height: 40 }
