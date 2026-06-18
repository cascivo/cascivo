'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './code.module.css'

export interface CodeProps extends HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md'
}

export function Code({ size = 'md', className, children, ...props }: CodeProps) {
  return (
    <code
      data-size={size}
      className={cn(styles['code'], className as string | undefined)}
      {...props}
    >
      {children}
    </code>
  )
}
