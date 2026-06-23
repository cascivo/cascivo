'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './flow-panel.module.css'

export type FlowPanelPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface FlowPanelProps extends HTMLAttributes<HTMLDivElement> {
  position?: FlowPanelPosition
  children?: ReactNode
  className?: string
}

/**
 * An absolutely-positioned slot for custom UI on a flow canvas (a legend, a
 * toolbar). Pure presentational — no state.
 */
export function FlowPanel({
  position = 'top-right',
  children,
  className,
  ...rest
}: FlowPanelProps) {
  return (
    <div data-position={position} className={cn(styles['panel'], className)} {...rest}>
      {children}
    </div>
  )
}
