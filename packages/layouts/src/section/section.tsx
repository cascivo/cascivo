'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './section.module.css'
import type { SpaceStep } from '@cascivo/core'

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /**
   * Max inline size: content=72rem, wide=90rem, full=none
   *
   * @defaultValue `"content"`
   * @see the component manifest
   */
  width?: 'content' | 'wide' | 'full'
  /**
   * Stack gap between children (spacing token step)
   *
   * @defaultValue `8`
   * @see the component manifest
   */
  gap?: SpaceStep
  className?: string | undefined
}

export function Section({
  width = 'content',
  gap = 8,
  className,
  style,
  children,
  ...props
}: SectionProps) {
  const maxInlineSize = width === 'content' ? '72rem' : width === 'wide' ? '90rem' : 'none'
  return (
    <section
      className={cn(styles['section'], className)}
      style={{
        ['--_max' as string]: maxInlineSize,
        ['--_gap' as string]: `var(--cascivo-space-${gap})`,
        ...(style as CSSProperties | undefined),
      }}
      {...props}
    >
      <div className={styles['inner']}>{children}</div>
    </section>
  )
}
