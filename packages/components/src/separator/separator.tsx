import { cn } from '@cascivo/core/pure'
import type { HTMLAttributes } from 'react'
import styles from './separator.module.css'

export interface SeparatorProps extends HTMLAttributes<HTMLElement> {
  /**
   * Direction the rule runs: `horizontal` draws a full-width line, `vertical` a full-height
   * one that stretches to its flex row.
   *
   * @defaultValue `horizontal`
   * @see the component manifest
   */
  orientation?: 'horizontal' | 'vertical'
  /**
   * When true, the separator is purely visual and hidden from assistive tech
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  decorative?: boolean
}

export function Separator({
  orientation = 'horizontal',
  decorative = false,
  className,
  ...props
}: SeparatorProps) {
  if (orientation === 'horizontal' && !decorative) {
    return (
      <hr data-orientation="horizontal" className={cn(styles['separator'], className)} {...props} />
    )
  }

  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      data-orientation={orientation}
      className={cn(styles['separator'], className)}
      {...props}
    />
  )
}
