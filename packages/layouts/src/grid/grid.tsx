'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './grid.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number
  gap?: SpaceStep
}

export function Grid({ cols = 12, gap = 4, className, style, children, ...props }: GridProps) {
  return (
    <div
      className={cn(styles['grid'], className)}
      style={{
        ['--_grid-cols' as string]: String(cols),
        ['--_grid-gap' as string]: `var(--cascivo-space-${gap})`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  span?: number
}

export function GridItem({ span, className, style, ...props }: GridItemProps) {
  return (
    <div
      className={cn(styles['grid-item'], className)}
      style={span ? { ['--_span' as string]: String(span), ...style } : style}
      {...props}
    />
  )
}
