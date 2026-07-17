'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './text.module.css'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div'
  size?: 'sm' | 'md' | 'lg'
  weight?: 'normal' | 'medium' | 'semibold'
  muted?: boolean
}

export function Text({
  as: Tag = 'p',
  size = 'md',
  weight = 'normal',
  muted = false,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <Tag
      data-size={size}
      data-weight={weight}
      data-muted={muted ? '' : undefined}
      className={cn(styles['text'], className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
