'use client'
import styles from './progress.module.css'

export type ProgressVariant = 'primary' | 'info' | 'success' | 'warning' | 'error'
export type ProgressSize = 'sm' | 'md' | 'lg'

export interface ProgressProps {
  /** 0–100. Omit for indeterminate state. */
  value?: number
  variant?: ProgressVariant
  size?: ProgressSize
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}

export function Progress({
  value,
  variant = 'primary',
  size = 'md',
  className,
  ...aria
}: ProgressProps) {
  return (
    <progress
      className={[styles['progress'], className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      value={value}
      max={value !== undefined ? 100 : undefined}
      {...aria}
    />
  )
}
