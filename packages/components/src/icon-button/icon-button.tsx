'use client'
import { cn, Slot } from '@cascivo/core'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './icon-button.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name for the icon-only control. Required — there is no visible text. */
  label: string
  /** The icon to render. Alias for `children`. */
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline' | 'filled'
  /** Render the single child element instead of a `<button>` (composition). */
  asChild?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = 'md', variant = 'ghost', asChild = false, className, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      type={asChild ? undefined : 'button'}
      aria-label={label}
      data-size={size}
      data-variant={variant}
      className={cn(styles['iconButton'], className)}
      ref={ref}
      {...props}
    >
      {children ?? icon}
    </Comp>
  )
})
