'use client'
import { cn, useDraggable, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef, type RefObject } from 'react'
import { graphBounds, nodeBounds } from '../../engine/geometry.ts'
import { screenToFlow } from '../../engine/transform.ts'
import type { FlowNode, Viewport, XYPosition } from '../../engine/types.ts'
import type { FlowChromePosition } from '../flow-controls/flow-controls.tsx'
import styles from './flow-minimap.module.css'

export interface FlowMiniMapProps {
  nodes: FlowNode[]
  viewport: Viewport
  /** Canvas size — used to draw the visible-region rectangle. */
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
  position?: FlowChromePosition
  nodeColor?: string
  onViewportChange?: (viewport: Viewport) => void
  label?: string
  className?: string
}

/**
 * A scaled SVG overview of the graph with a draggable viewport rectangle.
 * Dragging the rectangle pans the main viewport. `useSignals()` first.
 */
export function FlowMiniMap({
  nodes,
  viewport,
  containerWidth,
  containerHeight,
  width = 200,
  height = 150,
  position = 'bottom-right',
  nodeColor,
  onViewportChange,
  label,
  className,
}: FlowMiniMapProps) {
  useSignals()

  const bounds = graphBounds(nodes) ?? { x: 0, y: 0, width: 1, height: 1 }
  const bw = bounds.width || 1
  const bh = bounds.height || 1
  const padX = bw * 0.1
  const padY = bh * 0.1
  const region = {
    x: bounds.x - padX,
    y: bounds.y - padY,
    width: bw + padX * 2,
    height: bh + padY * 2,
  }
  const scale = Math.min(width / region.width, height / region.height)
  const tx = -region.x * scale + (width - region.width * scale) / 2
  const ty = -region.y * scale + (height - region.height * scale) / 2
  const toMM = (p: XYPosition): XYPosition => ({ x: p.x * scale + tx, y: p.y * scale + ty })

  // Visible flow region → minimap rectangle.
  let viewRect: { x: number; y: number; w: number; h: number } | null = null
  if (containerWidth && containerHeight) {
    const tl = screenToFlow({ x: 0, y: 0 }, viewport)
    const br = screenToFlow({ x: containerWidth, y: containerHeight }, viewport)
    const tlMM = toMM(tl)
    viewRect = { x: tlMM.x, y: tlMM.y, w: (br.x - tl.x) * scale, h: (br.y - tl.y) * scale }
  }

  // Drag the viewport rectangle to pan the main viewport.
  const { handleRef, offset, isDragging } = useDraggable({ isDisabled: !onViewportChange })
  const rectRef = useRef<SVGRectElement | null>(null)
  const setRectRef = (el: SVGRectElement | null): void => {
    rectRef.current = el
    ;(handleRef as RefObject<Element | null>).current = el
  }
  const onChangeRef = useRef(onViewportChange)
  onChangeRef.current = onViewportChange
  const dragBase = useRef<{ vp: Viewport; off: { x: number; y: number } } | null>(null)
  useSignalEffect(() => {
    const dragging = isDragging.value
    const off = offset.value
    if (!onChangeRef.current) return
    if (!dragging) {
      dragBase.current = null
      return
    }
    if (!dragBase.current) dragBase.current = { vp: viewport, off }
    const base = dragBase.current
    const z = base.vp.zoom
    onChangeRef.current({
      x: base.vp.x - ((off.x - base.off.x) / scale) * z,
      y: base.vp.y - ((off.y - base.off.y) / scale) * z,
      zoom: z,
    })
  })

  return (
    <svg
      data-position={position}
      className={cn(styles['minimap'], className)}
      width={width}
      height={height}
      role="img"
      aria-label={label ?? t(builtin.flow.minimap)}
    >
      {nodes.map((node) => {
        const b = nodeBounds(node)
        const p = toMM({ x: b.x, y: b.y })
        return (
          <rect
            key={node.id}
            data-node-id={node.id}
            className={styles['node']}
            x={p.x}
            y={p.y}
            width={b.width * scale}
            height={b.height * scale}
            fill={nodeColor}
          />
        )
      })}
      {viewRect && (
        <rect
          ref={setRectRef}
          data-viewport=""
          className={styles['viewport']}
          x={viewRect.x}
          y={viewRect.y}
          width={viewRect.w}
          height={viewRect.h}
        />
      )}
    </svg>
  )
}
