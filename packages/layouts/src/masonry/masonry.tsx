'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './masonry.module.css'
import type { SpaceStep } from '../space'

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
        ['--_gap' as string]: `var(--cascivo-space-${gap})`,
        ...(style as CSSProperties | undefined),
      }}
      {...props}
    />
  )
}
