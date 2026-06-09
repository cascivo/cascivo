'use client'
import { cn } from '@cascade-ui/core'
import type { InputHTMLAttributes } from 'react'
import styles from './slider.module.css'

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Slider({
  label,
  className,
  id,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ...props
}: SliderProps) {
  const sliderId =
    id ?? (label ? `cascade-slider-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div className={cn(styles['wrapper'], className)} data-disabled={disabled || undefined}>
      {label && (
        <label className={styles['label']} htmlFor={sliderId}>
          {label}
        </label>
      )}
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={styles['slider']}
        {...props}
      />
    </div>
  )
}
