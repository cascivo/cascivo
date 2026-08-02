'use client'
import { createMachine, useMachine, cn } from '@cascivo/core'
import { forwardRef } from 'react'
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
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
}

/**
 * ⚠ `Select` is a **native `<select>` wrapper**, so its change handler is the DOM
 * `onChange(event)` — read the value off `event.target.value`. There is **no**
 * `onValueChange`; TypeScript unhelpfully suggests `onVolumeChange` when you try it.
 *
 * The catalog's `onValueChange` convention covers composite components that invent their
 * own value (`Tabs`, `Combobox`, `Toggle`, …). `Select`, like `Checkbox` and
 * `NativeSelect`, spreads onto a real element and inherits that element's event.
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  options: SelectOption[]
  size?: 'sm' | 'md' | 'lg'
}

/**
 * `forwardRef` so `ref` reaches the underlying `<select>` — and so it is TYPED. See
 * `textarea.tsx` for the full rationale (2026-07-28 report C10). `forwardRef` rather than a
 * bare `ref?: Ref<T>` prop keeps the `react >= 18` peer floor honest, since ref-as-prop does
 * not work there.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
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
  },
  ref,
) {
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
          ref={ref as never}
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
})
