'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './columns.module.css'
import type { SpaceStep } from '../space'

export interface ColumnsProps extends HTMLAttributes<HTMLDivElement> {
  count?: 2 | 3 | 4
  gap?: SpaceStep
}

export function Columns({
  count = 2,
  gap = 4,
  className,
  style,
  children,
  ...props
}: ColumnsProps) {
  // Outer element establishes the query container; the inner `.columns` grid hosts the
  // `@container` collapse rule, which can only resolve against an ancestor container.
  return (
    <div
      className={cn(styles['columns-container'], className)}
      style={{
        ['--_cols' as string]: String(count),
        ['--_gap' as string]: `var(--cascivo-space-${gap})`,
        ...style,
      }}
      {...props}
    >
      <div className={styles['columns']}>{children}</div>
    </div>
  )
}
