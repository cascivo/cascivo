'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './status.module.css'

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  /** Pulses the dot — only when the user allows motion. */
  pulse?: boolean
}

export function Status({
  status = 'neutral',
  pulse = false,
  className,
  children,
  ...props
}: StatusProps) {
  return (
    <span
      data-status={status}
      data-pulse={pulse ? '' : undefined}
      className={cn(styles['status'], className)}
      {...props}
    >
      <span aria-hidden="true" className={styles['dot']} />
      {children}
    </span>
  )
}
