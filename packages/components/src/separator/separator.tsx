'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './separator.module.css'

export interface SeparatorProps extends HTMLAttributes<HTMLElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export function Separator({
  orientation = 'horizontal',
  decorative = false,
  className,
  ...props
}: SeparatorProps) {
  if (orientation === 'horizontal' && !decorative) {
    return (
      <hr data-orientation="horizontal" className={cn(styles['separator'], className)} {...props} />
    )
  }

  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      data-orientation={orientation}
      className={cn(styles['separator'], className)}
      {...props}
    />
  )
}
