import { cn } from '@cascivo/core/pure'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './skeleton.module.css'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the visual style variant.
   *
   * @defaultValue `text`
   * @see the component manifest
   */
  variant?: 'text' | 'circle' | 'rect'
  width?: string
  height?: string
  /**
   * Number of bars for the text variant; the last bar renders shorter
   *
   * @defaultValue `1`
   * @see the component manifest
   */
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
