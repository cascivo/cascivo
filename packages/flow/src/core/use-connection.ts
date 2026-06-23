'use client'
import { useSignal, useSignalEffect, type ReadonlySignal } from '@cascivo/core'
import { useRef, type RefObject } from 'react'
import type { Connection, XYPosition } from '../engine/types.ts'

export interface ConnectionState {
  source: string
  sourceHandle?: string | undefined
  /** Source anchor (flow coords) — the live path origin. */
  from: XYPosition
  /** Current pointer (flow coords) — the live path end. */
  to: XYPosition
}

export interface UseConnectionOptions {
  /** The canvas container; pointerdown on a source handle within it starts a connection. */
  containerRef: RefObject<HTMLElement | null>
  /** Convert client (screen) coordinates to flow coordinates. */
  clientToFlow: (clientX: number, clientY: number) => XYPosition
  onConnect?: ((connection: Connection) => void) | undefined
  isValid?: ((connection: Connection) => boolean) | undefined
}

export interface UseConnectionReturn {
  /** The in-progress connection, or null. The canvas draws a live path from it. */
  connection: ReadonlySignal<ConnectionState | null>
}

const SOURCE_SELECTOR = '[data-flow-handle][data-handle-type="source"]'
const TARGET_SELECTOR = '[data-flow-handle][data-handle-type="target"]'

/**
 * Drag from a `source` handle to a `target` handle to create an edge. Tracks a
 * live connection in a signal; on a valid drop fires `onConnect`. All pointer
 * side effects live in `useSignalEffect`; SSR-guarded; no pointer capture (so
 * `pointerup.target` resolves to the handle under the pointer).
 */
export function useConnection(options: UseConnectionOptions): UseConnectionReturn {
  const { containerRef } = options
  const connection = useSignal<ConnectionState | null>(null)

  const onConnectRef = useRef(options.onConnect)
  onConnectRef.current = options.onConnect
  const isValidRef = useRef(options.isValid)
  isValidRef.current = options.isValid
  const toFlowRef = useRef(options.clientToFlow)
  toFlowRef.current = options.clientToFlow

  useSignalEffect(() => {
    if (typeof window === 'undefined') return
    const container = containerRef.current
    if (!container) return

    const onMove = (event: PointerEvent): void => {
      const current = connection.peek()
      if (!current) return
      connection.value = { ...current, to: toFlowRef.current(event.clientX, event.clientY) }
    }
    const onUp = (event: PointerEvent): void => {
      const current = connection.peek()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      connection.value = null
      if (!current) return
      const target = event.target
      const targetHandle = target instanceof Element ? target.closest(TARGET_SELECTOR) : null
      const targetNode = targetHandle?.closest('[data-node-id]')
      if (!targetNode) return
      const next: Connection = {
        source: current.source,
        target: targetNode.getAttribute('data-node-id') ?? '',
        sourceHandle: current.sourceHandle,
        targetHandle: targetHandle?.getAttribute('data-handle-id') ?? undefined,
      }
      if (!next.target || next.source === next.target) return
      if (isValidRef.current && !isValidRef.current(next)) return
      onConnectRef.current?.(next)
    }
    const onDown = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      const handle = target.closest(SOURCE_SELECTOR)
      if (!handle) return
      const node = handle.closest('[data-node-id]')
      if (!node) return
      // Stop the event reaching the node's window-level drag listener so starting
      // a connection on a handle does not also drag the node (container bubbles
      // before window).
      event.stopPropagation()
      const rect = handle.getBoundingClientRect()
      connection.value = {
        source: node.getAttribute('data-node-id') ?? '',
        sourceHandle: handle.getAttribute('data-handle-id') ?? undefined,
        from: toFlowRef.current(rect.left + rect.width / 2, rect.top + rect.height / 2),
        to: toFlowRef.current(event.clientX, event.clientY),
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }

    container.addEventListener('pointerdown', onDown)
    return () => {
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  })

  return { connection }
}
