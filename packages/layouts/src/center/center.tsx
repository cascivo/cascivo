import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './center.module.css'

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * CSS max-width value
   *
   * @defaultValue `48rem`
   * @see the component manifest
   */
  maxWidth?: string
}

export function Center({ maxWidth = '48rem', className, style, ...props }: CenterProps) {
  return (
    <div
      className={cn(styles['center'], className)}
      style={{ ['--_center-max' as string]: maxWidth, ...style }}
      {...props}
    />
  )
}
