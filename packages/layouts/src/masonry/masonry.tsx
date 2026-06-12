'use client'
import { cn } from '@cascade-ui/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './masonry.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface MasonryProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number
  gap?: SpaceStep
  className?: string | undefined
}

export function Masonry({ cols = 3, gap = 4, className, style, ...props }: MasonryProps) {
  return (
    <div
      className={cn(styles['masonry'], className)}
      style={{
        ['--_cols' as string]: String(cols),
        ['--_gap' as string]: `var(--cascade-space-${gap})`,
        ...(style as CSSProperties | undefined),
      }}
      {...props}
    />
  )
}
