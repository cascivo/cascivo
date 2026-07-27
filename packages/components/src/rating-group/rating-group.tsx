'use client'
import { cn } from '@cascivo/core'
import type { HTMLAttributes } from 'react'
import styles from './rating-group.module.css'

export interface RatingGroupLabels {
  rating?: (value: number, max: number) => string
}

export interface RatingGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number
  onValueChange?: (v: number) => void
  /**
   * Maximum allowed value.
   *
   * @defaultValue `5`
   * @see the component manifest
   */
  max?: number
  size?: 'sm' | 'md' | 'lg'
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * When true, the value is shown but cannot be edited.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  readOnly?: boolean
  labels?: RatingGroupLabels
}

function defaultRatingLabel(value: number, max: number): string {
  return `${value} of ${max} stars`
}

export function RatingGroup({
  value,
  onValueChange,
  max = 5,
  size = 'md',
  disabled = false,
  readOnly = false,
  labels,
  className,
  ...props
}: RatingGroupProps) {
  const labelFn = labels?.rating ?? defaultRatingLabel
  const isInteractive = !disabled && !readOnly && onValueChange !== undefined

  return (
    <div className={cn(styles['wrapper'], className)} data-size={size} role="radiogroup" {...props}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= value
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === value}
            aria-label={labelFn(starValue, max)}
            className={styles['star']}
            data-filled={isFilled ? '' : undefined}
            data-value={starValue}
            disabled={disabled}
            tabIndex={isInteractive ? 0 : -1}
            onClick={() => {
              if (isInteractive) onValueChange(starValue)
            }}
          />
        )
      })}
    </div>
  )
}
