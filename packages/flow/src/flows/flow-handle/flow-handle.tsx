'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import type { HandlePosition } from '../../engine/types.ts'
import styles from './flow-handle.module.css'

export interface FlowHandleProps extends HTMLAttributes<HTMLDivElement> {
  type: 'source' | 'target'
  /** Edge of the node the port sits on. Defaults by type (source→right, target→left). */
  position?: HandlePosition
  /** Handle id, for multi-handle nodes. */
  id?: string
  isConnectable?: boolean
  className?: string
}

function defaultPosition(type: 'source' | 'target'): HandlePosition {
  return type === 'source' ? 'right' : 'left'
}

/**
 * A connection port on a node edge. Marks where edges attach and where
 * interactive connect (T5) starts/ends. Renders a small dot inside a ≥44px
 * coarse-pointer hit area; keyboard-focusable. No internal state.
 */
export function FlowHandle({
  type,
  position,
  id,
  isConnectable = true,
  className,
  ...rest
}: FlowHandleProps) {
  const pos = position ?? defaultPosition(type)
  return (
    <div
      data-handle-type={type}
      data-handle-pos={pos}
      data-handle-id={id}
      data-connectable={isConnectable || undefined}
      data-flow-handle=""
      tabIndex={isConnectable ? 0 : -1}
      className={cn(styles['handle'], className)}
      {...rest}
    >
      <span className={styles['dot']} aria-hidden="true" />
    </div>
  )
}
