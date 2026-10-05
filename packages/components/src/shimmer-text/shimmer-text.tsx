import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './shimmer-text.module.css'

export interface ShimmerTextProps extends HTMLAttributes<HTMLElement> {
  /**
   * `span` for inline text, `p` for a paragraph, `div` for a block that imposes no semantics
   * of its own.
   *
   * @defaultValue `span`
   * @see the component manifest
   */
  as?: 'span' | 'p' | 'div'
}

export function ShimmerText({
  as: Component = 'span',
  className,
  children,
  ...props
}: ShimmerTextProps) {
  return (
    <Component
      className={cn(styles['shimmer-text'], className as string | undefined)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Component>
  )
}
