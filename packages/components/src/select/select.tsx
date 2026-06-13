'use client'
import { createMachine, useMachine, cn } from '@cascivo/core'
import type { SelectHTMLAttributes } from 'react'
import styles from './select.module.css'

const machine = createMachine({
  initial: 'idle' as const,
  states: {
    idle: { on: { FOCUS: 'focused' } },
    focused: { on: { BLUR: 'idle' } },
  },
})

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  options: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
}

export function Select({
  label,
  hint,
  error,
  placeholder,
  options,
  size = 'md',
  className,
  id,
  defaultValue,
  value,
  onFocus,
  onBlur,
  ...props
}: SelectProps) {
  const [state, send] = useMachine(machine)
  const selectId =
    id ?? (label ? `cascade-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)
  const isControlled = value !== undefined
  const hasPlaceholder = placeholder !== undefined

  return (
    <div
      className={cn(styles['wrapper'], className)}
      data-state={error ? 'error' : state.value}
      data-size={size}
    >
      {label && (
        <label className={styles['label']} htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className={styles['field']}>
        <select
          id={selectId}
          className={styles['select']}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          value={value}
          defaultValue={!isControlled && hasPlaceholder ? (defaultValue ?? '') : defaultValue}
          onFocus={(e) => {
            send('FOCUS')
            onFocus?.(e)
          }}
          onBlur={(e) => {
            send('BLUR')
            onBlur?.(e)
          }}
          {...props}
        >
          {hasPlaceholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles['chevron']} aria-hidden="true" />
      </div>
      {error && (
        <span id={`${selectId}-error`} className={styles['error']} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${selectId}-hint`} className={styles['hint']}>
          {hint}
        </span>
      )}
    </div>
  )
}
