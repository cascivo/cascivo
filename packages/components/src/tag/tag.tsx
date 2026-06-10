'use client'
import { cn, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
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
  dismissLabel,
  className,
  children,
  ...props
}: TagProps) {
  useSignals()
  const resolvedDismissLabel = dismissLabel ?? t(builtin.tag.dismiss)
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
          aria-label={resolvedDismissLabel}
          onClick={onDismiss}
        >
          ✕
        </button>
      )}
    </span>
  )
}
