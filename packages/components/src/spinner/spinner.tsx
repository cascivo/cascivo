'use client'
import { cn, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes } from 'react'
import styles from './spinner.module.css'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function Spinner({ size = 'md', label, className, ...props }: SpinnerProps) {
  useSignals()
  const resolvedLabel = label ?? t(builtin.spinner.label)
  return (
    <span
      role="status"
      aria-label={resolvedLabel}
      data-size={size}
      className={cn(styles['spinner'], className as string | undefined)}
      {...props}
    />
  )
}
