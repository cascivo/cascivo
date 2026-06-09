'use client'
import { cn } from '@cascade-ui/core'
import type { ButtonHTMLAttributes } from 'react'
import styles from './button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-variant={variant}
      data-size={size}
      data-state={loading ? 'loading' : 'idle'}
      className={cn(styles['button'], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className={styles['spinner']} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}
