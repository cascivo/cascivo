'use client'
import { cn, createMachine, useMachine, useSignals } from '@cascivo/core'
import type { InputHTMLAttributes } from 'react'
import styles from './time-picker.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface TimePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> {
  value?: string
  defaultValue?: string
  /** Called with the new `HH:MM` time string when the value changes. */
  onValueChange?: (value: string) => void
  /** @deprecated Use `onValueChange` — it receives the same time string. */
  onChange?: (value: string) => void
  min?: string
  max?: string
  step?: number
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TimePicker({
  value,
  defaultValue,
  onValueChange,
  onChange,
  min,
  max,
  step,
  label,
  hint,
  error,
  size = 'md',
  className,
  id,
  onFocus,
  onBlur,
  ...props
}: TimePickerProps) {
  useSignals()
  const [state, send] = useMachine(machine)
  const inputId =
    id ?? (label ? `cascade-time-picker-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : state.value}
      data-size={size}
    >
      {label && (
        <label className={styles['label']} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="time"
        className={styles['input']}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        onChange={(e) => (onValueChange ?? onChange)?.(e.target.value)}
        onFocus={(e) => {
          send('FOCUS')
          onFocus?.(e)
        }}
        onBlur={(e) => {
          send('BLUR')
          onBlur?.(e)
        }}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${inputId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
