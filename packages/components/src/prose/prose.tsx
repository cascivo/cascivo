import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './prose.module.css'

export type ProseProps = HTMLAttributes<HTMLDivElement>

export function Prose({ className, children, ...props }: ProseProps) {
  return (
    <div className={cn(styles['prose'], className as string | undefined)} {...props}>
      {children}
    </div>
  )
}
