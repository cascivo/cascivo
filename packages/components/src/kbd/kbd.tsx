import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './kbd.module.css'

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md'
}

export function Kbd({ size = 'md', className, children, ...props }: KbdProps) {
  return (
    <kbd data-size={size} className={cn(styles['kbd'], className)} {...props}>
      {children}
    </kbd>
  )
}
