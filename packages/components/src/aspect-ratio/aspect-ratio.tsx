import { cn } from '@cascivo/core'
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './aspect-ratio.module.css'

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Width-to-height ratio applied via the CSS aspect-ratio property
   *
   * @defaultValue `16 / 9`
   * @see the component manifest
   */
  ratio?: number
  children?: ReactNode
}

export function AspectRatio({
  ratio = 16 / 9,
  className,
  style,
  children,
  ...props
}: AspectRatioProps) {
  return (
    <div
      className={cn(styles['root'], className)}
      style={{ '--cascivo-aspect-ratio': ratio, ...style } as CSSProperties}
      {...props}
    >
      <div className={styles['inner']}>{children}</div>
    </div>
  )
}
