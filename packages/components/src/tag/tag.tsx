'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './tag.module.css'

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  onDismiss?: () => void
  dismissLabel?: string
}

export function Tag({
  variant = 'default',
  size = 'md',
  onDismiss,
  dismissLabel = 'Remove',
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      data-variant={variant}
      data-size={size}
      className={cn(styles['tag'], className)}
      {...props}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          className={styles['dismiss']}
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          ✕
        </button>
      )}
    </span>
  )
}
