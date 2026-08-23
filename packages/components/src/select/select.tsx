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
  /**
   * Invisible accessible name, for when a visible element outside this component already
   * labels it (a heading in a settings row, a table column header) and `label` would render
   * that text a second time.
   *
   * `label` on this component is **visible** — it is painted next to the control. The catalog
   * splits that way deliberately, but `IconButton.label` and `Sparkline.label` are invisible
   * names, so an adopter arriving with that prior writes `label` here and gets the text twice
   * (2026-08-22 report item 13). Both props are now listed side by side, each saying which it
   * is, which is the only thing that interrupts a confident wrong guess.
   *
   * The raw DOM `aria-label` is still accepted and wins over this.
   */
  ariaLabel?: string
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
    ariaLabel,
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
          aria-label={props['aria-label'] ?? ariaLabel}
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
