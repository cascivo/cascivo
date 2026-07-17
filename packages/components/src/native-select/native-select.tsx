'use client'
import { cn } from '@cascivo/core'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import styles from './native-select.module.css'

export interface NativeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Options to render. Alternatively pass `<option>` children. */
  options?: NativeSelectOption[]
  /** Raw `<option>` children (used when `options` is not provided). */
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Marks the control as invalid for error styling and a11y. */
  invalid?: boolean
  /** Placeholder rendered as a disabled, hidden first option. */
  placeholder?: string
}

/**
 * A styled native `<select>` — keeps the platform's open/close, keyboard, and form behavior, and
 * layers on a custom chevron and focus/invalid rings via CSS only. No JS interactivity, so no
 * signals: the browser owns all state. Distinct from the custom-rendered `Select` listbox.
 */
export function NativeSelect({
  options,
  children,
  size = 'md',
  invalid,
  disabled,
  placeholder,
  value,
  defaultValue,
  className,
  ...props
}: NativeSelectProps) {
  const isControlled = value !== undefined
  const hasPlaceholder = placeholder !== undefined

  return (
    <div
      className={cn(styles['root'], className)}
      data-size={size}
      data-invalid={invalid || undefined}
    >
      <select
        className={styles['select']}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        value={value}
        defaultValue={!isControlled && hasPlaceholder ? (defaultValue ?? '') : defaultValue}
        {...props}
      >
        {hasPlaceholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      <span className={styles['chevron']} aria-hidden="true" />
    </div>
  )
}
