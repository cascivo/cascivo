import { useId } from 'react'
import styles from './radial-progress.module.css'

export type RadialProgressSize = 'sm' | 'md' | 'lg'
export type RadialProgressVariant = 'primary' | 'info' | 'success' | 'warning' | 'error'

export interface RadialProgressProps {
  value: number
  size?: RadialProgressSize
  variant?: RadialProgressVariant
  children?: React.ReactNode
  'aria-label'?: string
  className?: string
}

export function RadialProgress({
  value,
  size = 'md',
  variant = 'primary',
  children,
  className,
  ...aria
}: RadialProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const labelId = useId()
  // progressbar takes its name from the author only — visible text doesn't
  // count. Name it from its own label span unless the caller passed aria-label.
  const hasAriaLabel = Boolean(aria['aria-label'])
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-labelledby={hasAriaLabel ? undefined : labelId}
      className={[styles.radialProgress, className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      style={
        { '--cascivo-radial-progress': clamped } as React.CSSProperties & {
          '--cascivo-radial-progress': number
        }
      }
      {...aria}
    >
      <span id={labelId} className={styles.label}>
        {children ?? `${clamped}%`}
      </span>
    </div>
  )
}
