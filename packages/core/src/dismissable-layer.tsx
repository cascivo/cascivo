'use client'
import { useRef, type ReactNode } from 'react'
import { useSignalEffect, useSignals } from './signals.ts'

// Module-level registry so nested layers (a dropdown inside a modal) dismiss top-first. Effects
// mount child-first, so a stack would invert nesting; instead we resolve the top-most layer by DOM
// depth — a layer responds only when no other mounted layer's root is nested inside its own root.
interface LayerEntry {
  getRoot: () => HTMLElement | null
}
const layers: LayerEntry[] = []

export interface DismissableLayerProps {
  children: ReactNode
  /** Called when an outside pointer lands or Escape is pressed (when this is the top-most layer). */
  onDismiss?: () => void
  /** Disable the outside-pointer dismissal (Escape still works unless escapeDismisses is false). */
  disableOutsidePointer?: boolean
  /** Whether Escape dismisses the top-most layer. Default true. */
  escapeDismisses?: boolean
}

/**
 * Wraps its children and dismisses on an outside pointer press or Escape. One tested implementation
 * of the dismissal logic every overlay reinvents. Nested layers form a stack — only the top-most
 * responds to Escape and outside pointers. All listeners run inside `useSignalEffect`.
 */
export function DismissableLayer({
  children,
  onDismiss,
  disableOutsidePointer,
  escapeDismisses = true,
}: DismissableLayerProps) {
  useSignals()
  const rootRef = useRef<HTMLDivElement>(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useSignalEffect(() => {
    if (typeof document === 'undefined') return
    const entry: LayerEntry = { getRoot: () => rootRef.current }
    layers.push(entry)

    // Top-most = deepest in the DOM: no other mounted layer's root sits inside this one's root.
    const isTop = (): boolean => {
      const root = rootRef.current
      if (!root) return false
      for (const other of layers) {
        if (other === entry) continue
        const otherRoot = other.getRoot()
        if (otherRoot && root.contains(otherRoot)) return false
      }
      return true
    }

    const handlePointer = (event: PointerEvent): void => {
      if (disableOutsidePointer || !isTop()) return
      const root = rootRef.current
      if (!root) return
      if (event.target instanceof Node && !root.contains(event.target)) {
        onDismissRef.current?.()
      }
    }
    const handleKey = (event: KeyboardEvent): void => {
      if (!escapeDismisses || event.key !== 'Escape' || !isTop()) return
      onDismissRef.current?.()
    }

    document.addEventListener('pointerdown', handlePointer, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer, true)
      document.removeEventListener('keydown', handleKey)
      const idx = layers.indexOf(entry)
      if (idx !== -1) layers.splice(idx, 1)
    }
  })

  return <div ref={rootRef}>{children}</div>
}
