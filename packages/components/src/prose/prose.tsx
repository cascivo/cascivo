'use client'
import { cn } from '@cascade-ui/core'
import type { HTMLAttributes } from 'react'
import styles from './prose.module.css'

export type ProseProps = HTMLAttributes<HTMLDivElement>

export function Prose({ className, children, ...props }: ProseProps) {
  return (
    <div className={cn(styles['prose'], className)} {...props}>
      {children}
    </div>
  )
}
