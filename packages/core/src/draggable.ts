'use client'
import { useRef, type RefObject } from 'react'
import { useSignal, useSignalEffect, type ReadonlySignal } from './signals.ts'

export interface DragOffset {
  x: number
  y: number
}

/** Pointer velocity at drag end, in pixels per millisecond. Sign follows the drag direction. */
export interface DragVelocity {
  x: number
  y: number
}

export interface UseDraggableOptions {
  isDisabled?: boolean
  onDragEnd?: (offset: DragOffset) => void
  /** Constrain dragging to an axis. Default 'both'. */
  axis?: 'x' | 'y' | 'both'
}

export interface UseDraggableReturn {
  /** Attach to the drag handle (e.g. a modal header). */
  handleRef: RefObject<HTMLElement | null>
  /** Attach to the moved element; apply `offset` as a CSS translate. */
  targetRef: RefObject<HTMLElement | null>
  offset: ReadonlySignal<DragOffset>
  /**
   * Pointer velocity (px/ms) from the final ~100ms of the most recent drag.
   * Set immediately before `onDragEnd` fires, so callbacks can read it to drive
   * fling/flick decisions. Zeroed by `reset()`.
   */
  velocity: ReadonlySignal<DragVelocity>
  isDragging: ReadonlySignal<boolean>
  reset: () => void
}

/** Velocity is averaged over samples no older than this (ms) at pointer-up. */
const VELOCITY_WINDOW_MS = 100

/**
 * Pointer-driven drag offset for overlays. Returns an `{ x, y }` offset signal
 * the caller applies as a CSS `translate` (no animation library). Attaches
 * pointer listeners in `useSignalEffect` and removes them on teardown.
 * SSR/no-DOM safe. Replaces HeroUI's `@heroui/use-draggable` (Framer-free).
 * No `useState`/`useEffect`.
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const handleRef = useRef<HTMLElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const offset = useSignal<DragOffset>({ x: 0, y: 0 })
  const velocity = useSignal<DragVelocity>({ x: 0, y: 0 })
  const isDragging = useSignal(false)

  const disabled = useSignal(options.isDisabled ?? false)
  disabled.value = options.isDisabled ?? false
  const axisRef = useRef(options.axis ?? 'both')
  axisRef.current = options.axis ?? 'both'
  const onDragEndRef = useRef(options.onDragEnd)
  onDragEndRef.current = options.onDragEnd

  useSignalEffect(() => {
    const isDisabled = disabled.value
    if (isDisabled || typeof window === 'undefined') return

    let startX = 0
    let startY = 0
    let baseX = 0
    let baseY = 0
    let activeHandle: HTMLElement | null = null
    // Recent {t,x,y} pointer samples, used to estimate fling velocity at release.
    let samples: { t: number; x: number; y: number }[] = []

    const sample = (event: PointerEvent): void => {
      samples.push({ t: performance.now(), x: event.clientX, y: event.clientY })
    }
    const computeVelocity = (): DragVelocity => {
      const last = samples.at(-1)
      if (!last) return { x: 0, y: 0 }
      // Oldest sample still within the averaging window (or the first sample).
      const first = samples.find((s) => last.t - s.t <= VELOCITY_WINDOW_MS) ?? samples[0]
      if (!first) return { x: 0, y: 0 }
      const dt = last.t - first.t
      if (dt <= 0) return { x: 0, y: 0 }
      const axis = axisRef.current
      return {
        x: axis === 'y' ? 0 : (last.x - first.x) / dt,
        y: axis === 'x' ? 0 : (last.y - first.y) / dt,
      }
    }

    const onMove = (event: PointerEvent): void => {
      const axis = axisRef.current
      const dx = axis === 'y' ? 0 : event.clientX - startX
      const dy = axis === 'x' ? 0 : event.clientY - startY
      offset.value = { x: baseX + dx, y: baseY + dy }
      sample(event)
    }
    const onUp = (event: PointerEvent): void => {
      isDragging.value = false
      activeHandle?.releasePointerCapture?.(event.pointerId)
      activeHandle = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      velocity.value = computeVelocity()
      onDragEndRef.current?.(offset.value)
    }
    // Listen on the window and resolve the handle lazily, so the handle element
    // need not be attached when this effect first runs — it may live deep inside
    // a portal/overlay whose ref commits after this hook's owner.
    const onDown = (event: PointerEvent): void => {
      const handle = handleRef.current
      const target = event.target
      if (!handle || !(target instanceof Node) || !handle.contains(target)) return
      activeHandle = handle
      startX = event.clientX
      startY = event.clientY
      baseX = offset.value.x
      baseY = offset.value.y
      samples = []
      sample(event)
      isDragging.value = true
      handle.setPointerCapture?.(event.pointerId)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  })

  return {
    handleRef,
    targetRef,
    offset,
    velocity,
    isDragging,
    reset: () => {
      offset.value = { x: 0, y: 0 }
      velocity.value = { x: 0, y: 0 }
    },
  }
}
