'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './auto-grid.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface AutoGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Minimum track size before items wrap to fewer columns. */
  min?: string
  gap?: SpaceStep
}

export function AutoGrid({ min = '16rem', gap = 4, className, style, ...props }: AutoGridProps) {
  return (
    <div
      className={cn(styles['auto-grid'], className)}
      style={{
        ['--_min' as string]: min,
        ['--_gap' as string]: `var(--cascade-space-${gap})`,
        ...style,
      }}
      {...props}
    />
  )
}
