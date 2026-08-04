import { cn } from '@cascivo/core/pure'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './auto-grid.module.css'
import type { SpaceStep } from '@cascivo/core'

export interface AutoGridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Minimum track width before items wrap to fewer columns
   *
   * @defaultValue `"16rem"`
   * @see the component manifest
   */
  min?: string
  /**
   * Spacing token step. Maps to the --cascivo-space-* scale, which intentionally skips
   * 7/9/11 — use 6 or 8.
   *
   * @defaultValue `4`
   * @see the component manifest
   */
  gap?: SpaceStep
  className?: string | undefined
}

export function AutoGrid({ min = '16rem', gap = 4, className, style, ...props }: AutoGridProps) {
  return (
    <div
      className={cn(styles['auto-grid'], className)}
      style={{
        ['--_min' as string]: min,
        ['--_gap' as string]: `var(--cascivo-space-${gap})`,
        ...(style as CSSProperties | undefined),
      }}
      {...props}
    />
  )
}
