'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './progress-circle.module.css'

const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface ProgressCircleProps extends HTMLAttributes<HTMLDivElement> {
  /** Current value from 0 to max — clamped. */
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /** Renders the rounded percentage in the center — pairs best with md and lg. */
  showValue?: boolean
  /** Accessible name for the progressbar. */
  label?: string
}

export function ProgressCircle({
  value,
  max = 100,
  size = 'md',
  showValue = false,
  label,
  className,
  ...props
}: ProgressCircleProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? (clamped / max) * 100 : 0
  const offset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-label={label}
      data-size={size}
      className={cn(styles['progressCircle'], className as string | undefined)}
      {...props}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className={styles['svg']}>
        <circle
          className={styles['track']}
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
        />
        <circle
          className={styles['fill']}
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && <span className={styles['value']}>{Math.round(percent)}%</span>}
    </div>
  )
}
