'use client'
import { createMachine, useMachine, cn } from '@cascade-ui/core'
import type { InputHTMLAttributes } from 'react'
import styles from './input.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Input({
  label,
  hint,
  error,
  size = 'md',
  className,
  id,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [state, send] = useMachine(machine)
  const inputId =
    id ?? (label ? `cascade-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

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
        className={styles['input']}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
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
