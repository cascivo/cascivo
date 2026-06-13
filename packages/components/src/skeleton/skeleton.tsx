'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './skeleton.module.css'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect'
  width?: string
  height?: string
  lines?: number
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  const sizeVars = {
    ...(width !== undefined && { '--cascivo-skeleton-width': width }),
    ...(height !== undefined && { '--cascivo-skeleton-height': height }),
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      data-variant={variant}
      className={cn(styles['skeleton'], className)}
      style={{ ...sizeVars, ...style }}
      {...props}
    >
      {variant === 'text' &&
        Array.from({ length: lines }, (_, index) => (
          <span key={index} className={styles['line']} />
        ))}
    </div>
  )
}
