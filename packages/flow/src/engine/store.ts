'use client'
import { useControllableSignal, type Signal } from '@cascivo/core'
import type { FlowEdge, FlowNode, Viewport } from './types.ts'

export interface UseFlowOptions {
  /** Controlled nodes. When provided, the parent owns node state. */
  nodes?: FlowNode[] | undefined
  defaultNodes?: FlowNode[] | undefined
  onNodesChange?: ((nodes: FlowNode[]) => void) | undefined
  /** Controlled edges. */
  edges?: FlowEdge[] | undefined
  defaultEdges?: FlowEdge[] | undefined
  onEdgesChange?: ((edges: FlowEdge[]) => void) | undefined
  /** Controlled viewport. */
  viewport?: Viewport | undefined
  defaultViewport?: Viewport | undefined
  onViewportChange?: ((viewport: Viewport) => void) | undefined
}

export interface FlowStore {
  nodes: Signal<FlowNode[]>
  edges: Signal<FlowEdge[]>
  viewport: Signal<Viewport>
  setNodes: (nodes: FlowNode[]) => void
  updateNode: (id: string, patch: Partial<FlowNode>) => void
  setEdges: (edges: FlowEdge[]) => void
  addEdge: (edge: FlowEdge) => void
  setViewport: (viewport: Viewport) => void
}

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

/**
 * The flow state model — plain signals (no Zustand, no MVX). `nodes`, `edges`,
 * and `viewport` are controllable signals with action helpers. No banned hooks.
 */
export function useFlow(options: UseFlowOptions = {}): FlowStore {
  const [nodes, setNodes] = useControllableSignal<FlowNode[]>({
    value: options.nodes,
    defaultValue: options.defaultNodes ?? [],
    onChange: options.onNodesChange,
  })
  const [edges, setEdges] = useControllableSignal<FlowEdge[]>({
    value: options.edges,
    defaultValue: options.defaultEdges ?? [],
    onChange: options.onEdgesChange,
  })
  const [viewport, setViewport] = useControllableSignal<Viewport>({
    value: options.viewport,
    defaultValue: options.defaultViewport ?? DEFAULT_VIEWPORT,
    onChange: options.onViewportChange,
  })

  const updateNode = (id: string, patch: Partial<FlowNode>): void => {
    setNodes(nodes.value.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  }
  const addEdge = (edge: FlowEdge): void => {
    setEdges([...edges.value, edge])
  }

  return {
    nodes,
    edges,
    viewport,
    setNodes,
    updateNode,
    setEdges,
    addEdge,
    setViewport,
  }
}
