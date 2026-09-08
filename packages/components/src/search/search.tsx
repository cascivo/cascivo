'use client'
import {
  cn,
  focusElement,
  useControllableSignal,
  useId,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { useRef } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import styles from './search.module.css'

export interface SearchProps {
  /**
   * Wired automatically by a wrapping `Field` — its label id. When present the control is
   * already named from outside, so the built-in fallback name is not applied.
   */
  'aria-labelledby'?: string
  /**
   * Wired automatically by a wrapping `Field` — the ids of its hint/error text. Forwarded to
   * the focusable control so the supporting text is announced, not just displayed.
   */
  'aria-describedby'?: string
  /** Wired automatically by a wrapping `Field` when it is in an error state. */
  'aria-invalid'?: boolean
  value?: string
  defaultValue?: string
  /** Called with the current text on every keystroke. */
  onValueChange?: (value: string) => void
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
   * Accessible name set through `aria-label` instead of a rendered `<label>` element.
   *
   * ⚠ On `Search`, **both** props give an invisible name — `label` renders a real `<label>`
   * that the stylesheet visually hides (see it above). The two differ in mechanism, not in
   * what you see: `label` names the control through a `<label for>` association, `ariaLabel`
   * through the attribute. Use `ariaLabel` when a visible element outside the component
   * already labels the field, so nothing is announced twice; use `label` otherwise.
   *
   * This docblock previously read "`label` on this component is **visible**", copied from
   * `Input`/`Select`/`Toggle` where that is true. It is not true here, and the contradiction
   * sat inside the `.d.ts` the docs tell you to trust over everything else (2026-08-31
   * report §20).
   */
  ariaLabel?: string
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
  onSearch,
  debounceMs = 300,
  placeholder,
  size = 'md',
  label,
  ariaLabel,
  disabled = false,
  clearLabel,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
}: SearchProps) {
  useSignals()
  const resolvedPlaceholder = placeholder ?? t(builtin.search.placeholder)
  // A wrapping Field already names the control; rendering the built-in label too would
  // concatenate into the accessible name ("Production domains Search").
  const externallyLabelled = ariaLabelledBy !== undefined
  const resolvedLabel = label ?? (externallyLabelled ? undefined : t(builtin.search.label))
  const resolvedClearLabel = clearLabel ?? t(builtin.search.clear)
  const inputRef = useRef<HTMLInputElement>(null)

  const generatedId = useId('cascade-search')
  const inputId = id ?? generatedId

  const isControlled = value !== undefined
  // Controlled mirror goes through the shared primitive: a bare `sig.value = prop` in render
  // notifies the previous render's subscriptions, which React 19 reports as a setState during
  // render (2026-08-08 report A). The primitive skips the write when the value is unchanged.
  const [current] = useControllableSignal<string>({ value, defaultValue })

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
    onValueChange?.(next)
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
    onValueChange?.('')
    onSearch?.('')
    focusElement(inputRef.current)
  }

  const filled = current.value !== ''

  return (
    <div
      className={cn(styles['root'], className)}
      data-size={size}
      data-state={filled ? 'filled' : 'empty'}
    >
      {resolvedLabel !== undefined && (
        <label className={styles['label']} htmlFor={inputId}>
          {resolvedLabel}
        </label>
      )}
      <span className={styles['icon']}>
        <MagnifierIcon />
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
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
