'use client'
import { cn } from '@cascade-ui/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import styles from './section.module.css'

type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Max inline size of the inner content wrapper. */
  width?: 'content' | 'wide' | 'full'
  /** Internal stack gap between child elements. */
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
