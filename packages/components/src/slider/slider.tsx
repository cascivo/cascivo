'use client'
import { cn } from '@cascivo/core'
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './slider.module.css'

/**
 * ⚠ `Slider` is a **native `<input type="range">` wrapper**, so its change handler is the
 * DOM `onChange(event)` — read the value off `event.target.value`. There is **no**
 * `onValueChange`, despite the catalog convention of that name for value-carrying
 * callbacks: that convention covers composite components that invent their own value,
 * while this one inherits the underlying element's event.
 */
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

/**
 * `forwardRef` so `ref` reaches the underlying `<input>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). `forwardRef` rather than a
 * bare `ref?: Ref<T>` prop keeps the `react >= 18` peer floor honest, since ref-as-prop does
 * not work there.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { label, className, id, min = 0, max = 100, step = 1, disabled, ...props },
  ref,
) {
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
        ref={ref as never}
        {...props}
      />
    </div>
  )
})
