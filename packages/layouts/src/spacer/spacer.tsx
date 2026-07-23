'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './spacer.module.css'
import type { SpaceStep } from '@cascivo/core'

export interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpaceStep
}

export function Spacer({ size = 4, className, style, ...props }: SpacerProps) {
  return (
    <div
      role="none"
      className={cn(styles['spacer'], className)}
      style={{ ['--_spacer-size' as string]: `var(--cascivo-space-${size})`, ...style }}
      {...props}
    />
  )
}
