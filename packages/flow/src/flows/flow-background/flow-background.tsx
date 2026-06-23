'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './flow-background.module.css'

export type FlowBackgroundVariant = 'dots' | 'grid' | 'cross'

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /** Pattern style. Default `dots`. */
  variant?: FlowBackgroundVariant
  /** Distance between pattern cells, in flow px. Default 20. */
  gap?: number
  /** Dot radius / line thickness, in flow px. Default 1. */
  size?: number
  /** Pattern color. Defaults to the border token. */
  color?: string
  className?: string
}

/**
 * Decorative dots / grid / cross background, drawn purely in CSS gradients
 * (no SVG, no per-cell DOM). Lives inside the transformed pane, so it pans and
 * scales with the viewport for free. `pointer-events: none` — clicks fall
 * through to the pan surface.
 */
export function FlowBackground({
  variant = 'dots',
  gap = 20,
  size = 1,
  color,
  className,
  style,
  ...rest
}: FlowBackgroundProps) {
  return (
    <div
      data-variant={variant}
      aria-hidden="true"
      className={cn(styles['background'], className)}
      style={{
        ['--flow-bg-gap' as string]: `${gap}px`,
        ['--flow-bg-size' as string]: `${size}px`,
        ['--flow-bg-thick' as string]: `${Math.max(1, size)}px`,
        ...(color ? { ['--flow-bg-color' as string]: color } : {}),
        ...style,
      }}
      {...rest}
    />
  )
}
