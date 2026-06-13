'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './columns.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface ColumnsProps extends HTMLAttributes<HTMLDivElement> {
  count?: 2 | 3 | 4
  gap?: SpaceStep
}

export function Columns({ count = 2, gap = 4, className, style, ...props }: ColumnsProps) {
  return (
    <div
      className={cn(styles['columns'], className)}
      style={{
        ['--_cols' as string]: String(count),
        ['--_gap' as string]: `var(--cascivo-space-${gap})`,
        ...style,
      }}
      {...props}
    />
  )
}
