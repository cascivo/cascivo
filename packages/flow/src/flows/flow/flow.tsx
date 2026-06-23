'use client'
import { cn, useSignal, useSignals } from '@cascivo/core'
import type { CSSProperties, ReactNode } from 'react'
import { FlowCanvas } from '../../core/flow-canvas/flow-canvas.tsx'
import { useConnection } from '../../core/use-connection.ts'
import { useViewport } from '../../core/use-viewport.ts'
import { applyLayout, type LayoutStrategy } from '../../engine/layout.ts'
import { handleAnchor } from '../../engine/geometry.ts'
import { useFlow } from '../../engine/store.ts'
import { screenToFlow } from '../../engine/transform.ts'
import type { NodeSize } from '../../engine/types.ts'
import type {
  Connection,
  EdgePathType,
  FlowEdge as FlowEdgeData,
  FlowNode as FlowNodeData,
} from '../../engine/types.ts'
import { FlowBackground, type FlowBackgroundProps } from '../flow-background/flow-background.tsx'
import { FlowControls } from '../flow-controls/flow-controls.tsx'
import { FlowEdge } from '../flow-edge/flow-edge.tsx'
import { FlowHandle } from '../flow-handle/flow-handle.tsx'
import { FlowMiniMap } from '../flow-minimap/flow-minimap.tsx'
import { FlowNode } from '../flow-node/flow-node.tsx'
import styles from './flow.module.css'

export type NodeRenderer = (args: { node: FlowNodeData }) => ReactNode

export interface FlowProps {
  /** Initial nodes (serializable — an agent can emit these as JSON). */
  nodes: FlowNodeData[]
  /** Initial edges. */
  edges: FlowEdgeData[]
  onNodesChange?: (nodes: FlowNodeData[]) => void
  onEdgesChange?: (edges: FlowEdgeData[]) => void
  onConnect?: (connection: Connection) => void
  /** Custom node renderers keyed by `node.type`. */
  nodeTypes?: Record<string, NodeRenderer>
  /** Frame the graph on mount. Default true. */
  fitView?: boolean
  /** Show a background — `true` for dots, or pass props. Default false. */
  background?: boolean | FlowBackgroundProps
  /** Show zoom/fit controls. Default false. */
  controls?: boolean
  /** Show a minimap. Default false. */
  minimap?: boolean
  /** Arrange nodes: 'grid' | 'layered' | a custom function. */
  layout?: LayoutStrategy
  minZoom?: number
  maxZoom?: number
  /**
   * Interaction mode. When false (view mode), nodes can't be selected, dragged,
   * or connected and connection handles are hidden — pan/zoom still work.
   * Default true.
   */
  interactive?: boolean
  /** Highlight + animate a single edge (used by FlowStory's active step). */
  activeEdgeId?: string | undefined
  activeDirection?: 'forward' | 'reverse' | undefined
  className?: string
  style?: CSSProperties
}

let edgeSeq = 0

/**
 * The declarative, AI-first flow surface: `<Flow nodes={…} edges={…} />` over
 * plain serializable data. Composes the canvas, background, nodes, edges,
 * interactive connect, and optional chrome. `useSignals()` first; no banned hooks.
 */
export function Flow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
  fitView = true,
  background = false,
  controls = false,
  minimap = false,
  layout,
  minZoom,
  maxZoom,
  interactive = true,
  activeEdgeId,
  activeDirection,
  className,
  style,
}: FlowProps) {
  useSignals()

  const seededNodes = layout ? applyLayout(nodes, edges, layout) : nodes
  const store = useFlow({
    defaultNodes: seededNodes,
    defaultEdges: edges,
    onNodesChange,
    onEdgesChange,
  })
  const controller = useViewport(store, { minZoom, maxZoom, fitOnInit: fitView })

  const clientToFlow = (clientX: number, clientY: number) => {
    const el = controller.containerRef.current
    const rect = el?.getBoundingClientRect()
    return screenToFlow(
      { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) },
      store.viewport.peek(),
    )
  }

  const { connection } = useConnection({
    containerRef: controller.containerRef,
    clientToFlow,
    enabled: interactive,
    onConnect: (c) => {
      store.addEdge({ id: `e-${++edgeSeq}`, source: c.source, target: c.target })
      onConnect?.(c)
    },
  })

  const select = (id: string): void => {
    store.setNodes(store.nodes.value.map((n) => ({ ...n, selected: n.id === id })))
  }

  // Measured node sizes (kept out of the nodes array so onNodesChange stays a
  // user-intent signal). Edges anchor to these so they reach the real node box.
  const sizes = useSignal<Record<string, NodeSize>>({})
  const measure = (id: string, size: NodeSize): void => {
    const current = sizes.peek()[id]
    if (current && current.width === size.width && current.height === size.height) return
    sizes.value = { ...sizes.peek(), [id]: size }
  }

  const currentNodes = store.nodes.value
  const currentEdges = store.edges.value
  const zoom = store.viewport.value.zoom
  const measured = sizes.value
  const byId = new Map(
    currentNodes.map((n) => {
      const m = measured[n.id]
      return [n.id, m ? { ...n, width: m.width, height: m.height } : n]
    }),
  )

  const conn = connection.value

  const chrome = (
    <>
      {controls && (
        <FlowControls
          onZoomIn={controller.zoomIn}
          onZoomOut={controller.zoomOut}
          onFitView={() => controller.fitView()}
        />
      )}
      {minimap && (
        <FlowMiniMap
          nodes={currentNodes}
          viewport={store.viewport.value}
          containerWidth={controller.containerRef.current?.clientWidth}
          containerHeight={controller.containerRef.current?.clientHeight}
          onViewportChange={store.setViewport}
        />
      )}
    </>
  )

  return (
    <FlowCanvas
      flow={store}
      controller={controller}
      minZoom={minZoom}
      maxZoom={maxZoom}
      chrome={chrome}
      className={cn(styles['flow'], className)}
      style={style}
    >
      {background && <FlowBackground {...(typeof background === 'object' ? background : {})} />}

      {/* Edge layer (under nodes). */}
      {currentEdges.map((edge) => {
        const sourceNode = byId.get(edge.source)
        const targetNode = byId.get(edge.target)
        if (!sourceNode || !targetNode) return null
        const s = handleAnchor(sourceNode, 'right')
        const t = handleAnchor(targetNode, 'left')
        const isActive = activeEdgeId === edge.id
        const dir = isActive ? activeDirection : undefined
        // The active step's arrow follows the travel direction (reverse → arrow
        // at the source); otherwise honor the edge's own marker config.
        const markerStart =
          dir === 'reverse' ? true : dir === 'forward' ? false : (edge.markerStart ?? false)
        const markerEnd =
          dir === 'reverse' ? false : dir === 'forward' ? true : (edge.markerEnd ?? true)
        return (
          <FlowEdge
            key={edge.id}
            id={edge.id}
            sourceX={s.x}
            sourceY={s.y}
            targetX={t.x}
            targetY={t.y}
            type={(edge.type as EdgePathType) ?? 'bezier'}
            animated={edge.animated || isActive}
            active={isActive}
            direction={dir}
            markerStart={markerStart}
            markerEnd={markerEnd}
            label={edge.label}
            selected={edge.selected}
          />
        )
      })}

      {/* Live connection-in-progress path. */}
      {conn && (
        <FlowEdge
          sourceX={conn.from.x}
          sourceY={conn.from.y}
          targetX={conn.to.x}
          targetY={conn.to.y}
          markerEnd={false}
        />
      )}

      {/* Node layer. */}
      {currentNodes.map((node) => (
        <FlowNode
          key={node.id}
          id={node.id}
          position={node.position}
          zoom={zoom}
          interactive={interactive}
          selected={node.selected ?? false}
          onSelect={interactive ? select : undefined}
          onMeasure={(size) => measure(node.id, size)}
          onPositionChange={(position) => store.updateNode(node.id, { position })}
        >
          {nodeTypes && node.type && nodeTypes[node.type] ? (
            nodeTypes[node.type]!({ node })
          ) : (
            <>
              <span>
                {String((node.data as { label?: ReactNode } | undefined)?.label ?? node.id)}
              </span>
              {/* Connection ports only when interactive (view mode hides them). */}
              {interactive && <FlowHandle type="target" position="left" />}
              {interactive && <FlowHandle type="source" position="right" />}
            </>
          )}
        </FlowNode>
      ))}
    </FlowCanvas>
  )
}
