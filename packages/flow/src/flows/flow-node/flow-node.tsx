'use client'
import {
  cn,
  useControllableSignal,
  useDraggable,
  useResizeObserver,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { useRef, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import type { NodeSize, XYPosition } from '../../engine/types.ts'
import styles from './flow-node.module.css'

export interface FlowNodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  id: string
  /** Position in flow coordinates (controllable). */
  position?: XYPosition
  defaultPosition?: XYPosition
  onPositionChange?: (position: XYPosition) => void
  /** Reports the rendered box size so edges can anchor to the real node bounds. */
  onMeasure?: (size: NodeSize) => void
  /** Current zoom — drag deltas are divided by it so the node tracks the pointer. */
  zoom?: number
  selected?: boolean
  draggable?: boolean
  onSelect?: (id: string) => void
  children?: ReactNode
  className?: string
}

/**
 * An HTML node box positioned inside the viewport pane by `--flow-x`/`--flow-y`.
 * Draggable via `useDraggable` (zoom-corrected), selectable via CSS
 * `data-selected`, and renders arbitrary themed cascivo children.
 * `useSignals()` first; no `useState`/`useEffect`.
 */
export function FlowNode({
  id,
  position,
  defaultPosition,
  onPositionChange,
  onMeasure,
  zoom = 1,
  selected = false,
  draggable = true,
  onSelect,
  children,
  className,
  onClick,
  onKeyDown,
  ...rest
}: FlowNodeProps) {
  useSignals()
  const [pos, setPos] = useControllableSignal<XYPosition>({
    value: position,
    defaultValue: defaultPosition ?? position ?? { x: 0, y: 0 },
    onChange: onPositionChange,
  })

  const { handleRef, targetRef, offset, isDragging } = useDraggable({ isDisabled: !draggable })
  const { ref: measureRef, size } = useResizeObserver<HTMLDivElement>({ box: 'border-box' })
  // Same node element is the drag handle, the moved target, and the measured box.
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const setRefs = (el: HTMLDivElement | null): void => {
    nodeRef.current = el
    ;(handleRef as RefObject<HTMLElement | null>).current = el
    ;(targetRef as RefObject<HTMLElement | null>).current = el
    ;(measureRef as RefObject<HTMLElement | null>).current = el
  }

  // Report the rendered size so edges anchor to the real node bounds.
  const onMeasureRef = useRef(onMeasure)
  onMeasureRef.current = onMeasure
  useSignalEffect(() => {
    const s = size.value
    if (s && s.width > 0 && s.height > 0) onMeasureRef.current?.(s)
  })

  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  // Map the accumulated pointer offset to an absolute (zoom-corrected) position,
  // captured from the position at drag start. Listeners live in useDraggable.
  const dragBase = useRef<{ pos: XYPosition; off: { x: number; y: number } } | null>(null)
  useSignalEffect(() => {
    const dragging = isDragging.value
    const off = offset.value
    if (!draggable) return
    if (!dragging) {
      dragBase.current = null
      return
    }
    if (!dragBase.current) dragBase.current = { pos: pos.peek(), off }
    const base = dragBase.current
    const z = zoomRef.current || 1
    setPos({
      x: base.pos.x + (off.x - base.off.x) / z,
      y: base.pos.y + (off.y - base.off.y) / z,
    })
  })

  const p = pos.value

  return (
    <div
      ref={setRefs}
      data-node-id={id}
      data-selected={selected || undefined}
      data-dragging={isDragging.value || undefined}
      role="group"
      tabIndex={0}
      className={cn(styles['node'], className)}
      style={{
        ['--flow-x' as string]: `${p.x}px`,
        ['--flow-y' as string]: `${p.y}px`,
      }}
      onClick={(event) => {
        onSelect?.(id)
        onClick?.(event)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(id)
        }
        onKeyDown?.(event)
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
