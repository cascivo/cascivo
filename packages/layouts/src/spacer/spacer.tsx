'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './spacer.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

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
