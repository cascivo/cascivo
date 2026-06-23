'use client'
import { cn, useSignals } from '@cascivo/core'
import type { HTMLAttributes, ReactNode, RefObject } from 'react'
import { useFlow, type FlowStore } from '../../engine/store.ts'
import type { Viewport } from '../../engine/types.ts'
import { useViewport, type UseViewportReturn } from '../use-viewport.ts'
import styles from './flow-canvas.module.css'

export interface FlowCanvasProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  children?: ReactNode
  /** Share an external store (e.g. from `<Flow>`). When omitted, an internal one is created. */
  flow?: FlowStore
  /** Controlled viewport (used only when no external `flow` is provided). */
  viewport?: Viewport
  defaultViewport?: Viewport
  onViewportChange?: (viewport: Viewport) => void
  minZoom?: number
  maxZoom?: number
  /** Drag the empty pane to pan. Default true. */
  panOnDrag?: boolean
  /** Wheel/pinch to zoom. Default true. */
  zoomOnScroll?: boolean
  /** Frame the graph once on mount. Default false. */
  fitView?: boolean
  /** Expose the viewport controller to a parent (e.g. for `<FlowControls>`). */
  onReady?: (viewport: UseViewportReturn) => void
  className?: string
}

/**
 * The canvas pane: a single CSS-transformed layer driven by the `viewport`
 * signal, with drag-to-pan, wheel zoom, and fit-view. Renders `children`
 * (background, nodes, edges) inside the transformed pane. `useSignals()` first.
 */
export function FlowCanvas({
  children,
  flow,
  viewport: viewportProp,
  defaultViewport,
  onViewportChange,
  minZoom,
  maxZoom,
  panOnDrag = true,
  zoomOnScroll = true,
  fitView = false,
  onReady,
  className,
  role = 'application',
  ...rest
}: FlowCanvasProps) {
  useSignals()
  const internal = useFlow({
    viewport: viewportProp,
    defaultViewport,
    onViewportChange,
  })
  const store = flow ?? internal
  const controller = useViewport(store, {
    minZoom,
    maxZoom,
    panOnDrag,
    zoomOnScroll,
    fitOnInit: fitView,
  })
  onReady?.(controller)

  const vp = store.viewport.value

  return (
    <div
      ref={controller.containerRef}
      className={cn(styles['canvas'], className)}
      role={role}
      {...rest}
    >
      <div
        className={styles['pane']}
        style={{
          // Custom properties consumed by the pane transform.
          ['--flow-tx' as string]: `${vp.x}px`,
          ['--flow-ty' as string]: `${vp.y}px`,
          ['--flow-scale' as string]: String(vp.zoom),
        }}
      >
        <div
          ref={controller.panHandleRef as RefObject<HTMLDivElement>}
          className={styles['panSurface']}
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  )
}
