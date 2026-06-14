'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './aspect-ratio.module.css'

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /** Width-to-height ratio (e.g. 16 / 9). Defaults to 16/9. */
  ratio?: number
  children?: ReactNode
}

export function AspectRatio({
  ratio = 16 / 9,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) {
  return (
    <div
      className={cn(styles['root'], className)}
      style={{ '--cascivo-aspect-ratio': ratio, ...style } as CSSProperties}
      {...props}
    >
      <div className={styles['inner']}>{children}</div>
    </div>
  )
}
