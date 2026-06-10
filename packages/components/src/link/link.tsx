'use client'
import { cn } from '@cascade-ui/core'
import type { AnchorHTMLAttributes } from 'react'
import styles from './link.module.css'

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'standalone' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  external?: boolean
}

export function Link({
  variant = 'standalone',
  size = 'md',
  external = false,
  className,
  children,
  ...props
}: LinkProps) {
  return (
    <a
      data-variant={variant}
      data-size={size}
      data-external={external || undefined}
      className={cn(styles['link'], className)}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  )
}
