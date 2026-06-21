'use client'
import { cn, Slot } from '@cascivo/core'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from '../spinner/spinner'
import styles from './button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  /**
   * Render the single child element instead of a native `<button>` so the button
   * styling lands on, e.g., a real `<a href>` (preserves middle-click / open-in-new-tab).
   * The child owns its own content; the loading spinner is not rendered in this mode.
   */
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const shared = {
    'data-variant': variant,
    'data-size': size,
    'data-state': loading ? 'loading' : 'idle',
    'aria-busy': loading || undefined,
    className: cn(styles['button'], className),
  }

  if (asChild) {
    return (
      <Slot {...shared} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button {...shared} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}
