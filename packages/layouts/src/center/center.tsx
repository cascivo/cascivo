'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './center.module.css'

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: string
}

export function Center({ maxWidth = '48rem', className, style, ...props }: CenterProps) {
  return (
    <div
      className={cn(styles['center'], className)}
      style={{ ['--_center-max' as string]: maxWidth, ...style }}
      {...props}
    />
  )
}
