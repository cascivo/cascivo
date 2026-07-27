'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './text.module.css'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /**
   * The HTML element to render as.
   *
   * @defaultValue `p`
   * @see the component manifest
   */
  as?: 'p' | 'span' | 'div'
  size?: 'sm' | 'md' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold'
  /**
   * When true, renders in a muted/subtle color.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  muted?: boolean
}

export function Text({
  as: Component = 'p',
  size = 'md',
  weight = 'normal',
  muted = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Component
      data-size={size}
      data-weight={weight}
      data-muted={muted ? '' : undefined}
      className={cn(styles['text'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  )
}
