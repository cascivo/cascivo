'use client'
import { cn } from '@cascivo/core'
import type { CSSProperties } from 'react'
import styles from './progress-bar.module.css'

export interface ProgressBarProps {
  /** Current value from 0 to max. Omit for an indeterminate bar. */
  value?: number
  max?: number
  label?: string
  helperText?: string
  size?: 'sm' | 'md'
  status?: 'active' | 'success' | 'error'
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  helperText,
  size = 'md',
  status = 'active',
  className,
}: ProgressBarProps) {
  const indeterminate = value === undefined
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? (clamped / max) * 100 : 0
  const labelId = label ? `cascade-progress-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined
  const glyph = status === 'success' ? '✓' : status === 'error' ? '✕' : null

  return (
    <div
      data-status={status}
      data-size={size}
      data-state={indeterminate ? 'indeterminate' : undefined}
      className={cn(styles['progress'], className)}
    >
      {label && (
        <span id={labelId} className={styles['label']}>
          {label}
          {glyph && (
            <span className={styles['glyph']} aria-hidden="true">
              {glyph}
            </span>
          )}
        </span>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-labelledby={labelId}
        className={styles['track']}
      >
        <div
          className={styles['fill']}
          style={
            indeterminate
              ? undefined
              : ({ '--cascivo-progress-value': `${percent}%` } as CSSProperties)
          }
        />
      </div>
      {helperText && <span className={styles['helper']}>{helperText}</span>}
    </div>
  )
}
