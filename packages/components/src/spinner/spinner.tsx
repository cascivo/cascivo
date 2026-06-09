'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './spinner.module.css'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      data-size={size}
      className={cn(styles['spinner'], className)}
      {...props}
    />
  )
}
