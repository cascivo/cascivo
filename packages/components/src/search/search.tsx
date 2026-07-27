'use client'
import { cn, useId, useSignal, useSignalEffect, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import styles from './search.module.css'

export interface SearchProps {
  value?: string
  defaultValue?: string
  /** Called with the current text on every keystroke. */
  onValueChange?: (value: string) => void
  /** @deprecated Use `onValueChange` — it receives the same string. */
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  /**
   * Debounce delay (ms) before onSearch fires.
   *
   * @defaultValue `300`
   * @see the component manifest
   */
  debounceMs?: number
  /**
   * Placeholder text shown when the field is empty.
   *
   * @defaultValue `Search`
   * @see the component manifest
   */
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  /**
   * Accessible name for the control. Rendered as a real `<label>` that is **visually
   * hidden** by design — it changes the accessible name, not the visible UI. If you can see
   * it, the component stylesheet did not load (import `@cascivo/react/styles.css` or the
   * per-component CSS).
   *
   * @defaultValue `Search`
   * @see the component manifest
   */
  label?: string
  /**
   * When true, disables the control and removes it from the tab order.
   *
   * @defaultValue `false`
   * @see the component manifest
   */
  disabled?: boolean
  /**
   * Accessible label for the clear button.
   *
   * @defaultValue `Clear search`
   * @see the component manifest
   */
  clearLabel?: string
  id?: string
  className?: string
}

function MagnifierIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  )
}

export function Search({
  value,
  defaultValue = '',
  onValueChange,
  onChange,
  onSearch,
  debounceMs = 300,
  placeholder,
  size = 'md',
  label,
  disabled = false,
  clearLabel,
  id,
  className,
}: SearchProps) {
  useSignals()
  const resolvedPlaceholder = placeholder ?? t(builtin.search.placeholder)
  const resolvedLabel = label ?? t(builtin.search.label)
  const resolvedClearLabel = clearLabel ?? t(builtin.search.clear)
  const inputRef = useRef<HTMLInputElement>(null)

  const generatedId = useId('cascade-search')
  const inputId = id ?? generatedId

  const isControlled = value !== undefined
  const current = useSignal(isControlled ? value : defaultValue)
  if (isControlled) current.value = value

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Cancel any pending debounced search on unmount.
  useSignalEffect(() => clearTimer)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    if (!isControlled) current.value = next
    ;(onValueChange ?? onChange)?.(next)
    clearTimer()
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      onSearchRef.current?.(next)
    }, debounceMs)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      clearTimer()
      onSearch?.(current.value)
    }
  }

  const handleClear = () => {
    clearTimer()
    if (!isControlled) current.value = ''
    ;(onValueChange ?? onChange)?.('')
    onSearch?.('')
    inputRef.current?.focus()
  }

  const filled = current.value !== ''

  return (
    <div
      className={cn(styles['root'], className)}
      data-size={size}
      data-state={filled ? 'filled' : 'empty'}
    >
      <label className={styles['label']} htmlFor={inputId}>
        {resolvedLabel}
      </label>
      <span className={styles['icon']}>
        <MagnifierIcon />
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        className={styles['input']}
        value={current.value}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {filled && (
        <button
          type="button"
          className={styles['clear']}
          aria-label={resolvedClearLabel}
          disabled={disabled}
          onClick={handleClear}
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  )
}
