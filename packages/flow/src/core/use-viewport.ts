'use client'
import { useDraggable, useResizeObserver, useSignalEffect, type Signal } from '@cascivo/core'
import { useRef, type RefObject } from 'react'
import type { FlowStore } from '../engine/store.ts'
import { fitViewport, graphBounds, type Size } from '../engine/geometry.ts'
import { clampZoom, screenToFlow } from '../engine/transform.ts'
import type { Viewport, XYPosition } from '../engine/types.ts'

export interface UseViewportOptions {
  minZoom?: number | undefined
  maxZoom?: number | undefined
  /** Drag the empty pane to pan. Default true. */
  panOnDrag?: boolean | undefined
  /** Wheel/pinch to zoom. Default true. */
  zoomOnScroll?: boolean | undefined
  /** Fractional padding used by `fitView`. Default 0.1. */
  fitPadding?: number | undefined
  /** Frame the graph once, when the container is first measured. Default false. */
  fitOnInit?: boolean | undefined
}

export interface UseViewportReturn {
  /** Outer clipping container — attach for wheel + size measurement. */
  containerRef: RefObject<HTMLDivElement | null>
  /** Background drag-surface (behind nodes) — the pan handle. */
  panHandleRef: RefObject<HTMLElement | null>
  viewport: Signal<Viewport>
  /** Translate the viewport by a screen-space delta. */
  pan: (dx: number, dy: number) => void
  /** Set zoom (clamped), optionally keeping `center` (container coords) fixed. */
  zoomTo: (zoom: number, center?: XYPosition) => void
  zoomIn: () => void
  zoomOut: () => void
  /** Frame all nodes. Accepts an explicit container size (else the measured one). */
  fitView: (size?: Size) => void
}

const ZOOM_STEP = 1.2

/**
 * Pan/zoom/fit-view actions over the store's `viewport` signal. Pan reuses
 * `useDraggable` on the background surface; zoom attaches a clamped `wheel`
 * listener in `useSignalEffect`; fit-view composes `graphBounds` + the measured
 * container size. No `useState`/`useEffect`.
 */
export function useViewport(flow: FlowStore, options: UseViewportOptions = {}): UseViewportReturn {
  const {
    minZoom = 0.2,
    maxZoom = 2,
    panOnDrag = true,
    zoomOnScroll = true,
    fitPadding = 0.1,
    fitOnInit = false,
  } = options
  const { viewport, setViewport } = flow

  const { ref: containerRef, size } = useResizeObserver<HTMLDivElement>()
  const { handleRef: panHandleRef, offset, isDragging } = useDraggable({ isDisabled: !panOnDrag })

  const pan = (dx: number, dy: number): void => {
    const vp = viewport.peek()
    setViewport({ x: vp.x + dx, y: vp.y + dy, zoom: vp.zoom })
  }

  const zoomTo = (zoom: number, center?: XYPosition): void => {
    const vp = viewport.peek()
    const next = clampZoom(zoom, minZoom, maxZoom)
    if (!center) {
      setViewport({ x: vp.x, y: vp.y, zoom: next })
      return
    }
    // Keep the flow point under `center` fixed across the zoom change.
    const flowPt = screenToFlow(center, vp)
    setViewport({ x: center.x - flowPt.x * next, y: center.y - flowPt.y * next, zoom: next })
  }

  const containerCenter = (): XYPosition | undefined => {
    const el = containerRef.current
    if (!el) return undefined
    return { x: el.clientWidth / 2, y: el.clientHeight / 2 }
  }
  const zoomIn = (): void => zoomTo(viewport.peek().zoom * ZOOM_STEP, containerCenter())
  const zoomOut = (): void => zoomTo(viewport.peek().zoom / ZOOM_STEP, containerCenter())

  const measuredSize = (): Size | null => {
    const s = size.peek()
    if (s && s.width > 0 && s.height > 0) return s
    const el = containerRef.current
    if (el && el.clientWidth > 0) return { width: el.clientWidth, height: el.clientHeight }
    return null
  }

  const fitView = (explicit?: Size): void => {
    const bounds = graphBounds(flow.nodes.peek())
    if (!bounds) return
    const container = explicit ?? measuredSize()
    if (!container) return
    setViewport(fitViewport(bounds, container, { padding: fitPadding, minZoom, maxZoom }))
  }

  // Pan: while dragging the background surface, follow the pointer 1:1 (no zoom
  // correction — the translation is in screen pixels). Capture the viewport at
  // drag start so accumulated offsets map to absolute translation.
  const dragBase = useRef<{ vp: Viewport; off: { x: number; y: number } } | null>(null)
  useSignalEffect(() => {
    const dragging = isDragging.value
    const off = offset.value
    if (!panOnDrag) return
    if (!dragging) {
      dragBase.current = null
      return
    }
    if (!dragBase.current) dragBase.current = { vp: viewport.peek(), off }
    const base = dragBase.current
    setViewport({
      x: base.vp.x + (off.x - base.off.x),
      y: base.vp.y + (off.y - base.off.y),
      zoom: base.vp.zoom,
    })
  })

  // Zoom: clamp around the pointer focal point. passive:false to preventDefault.
  useSignalEffect(() => {
    if (!zoomOnScroll || typeof window === 'undefined') return
    const el = containerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
      zoomTo(viewport.peek().zoom * factor, cursor)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  // Optional one-shot fit once the container has a measured size.
  const didInitFit = useRef(false)
  useSignalEffect(() => {
    if (!fitOnInit || didInitFit.current) return
    const s = size.value
    if (!s || s.width === 0) return
    didInitFit.current = true
    fitView(s)
  })

  return {
    containerRef,
    panHandleRef,
    viewport,
    pan,
    zoomTo,
    zoomIn,
    zoomOut,
    fitView,
  }
}
