'use client'
import { cn, useSignal, useSignals } from '@cascade-ui/core'
import type { HTMLAttributes, ReactNode } from 'react'
import styles from './alert.module.css'

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  title?: string
  icon?: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
}

const assertiveVariants = new Set(['warning', 'destructive'])

export function Alert({
  variant = 'default',
  title,
  icon,
  dismissible = false,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  useSignals()
  const dismissed = useSignal(false)
  if (dismissed.value) return null

  return (
    <div
      role={assertiveVariants.has(variant) ? 'alert' : 'status'}
      data-variant={variant}
      className={cn(styles['alert'], className)}
      {...props}
    >
      {icon && (
        <span className={styles['icon']} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className={styles['body']}>
        {title && <div className={styles['title']}>{title}</div>}
        {children && <div className={styles['content']}>{children}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className={styles['dismiss']}
          aria-label="Dismiss"
          onClick={() => {
            dismissed.value = true
            onDismiss?.()
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
